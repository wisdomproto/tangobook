import crypto from 'node:crypto';
import { PLANS, isPlanId, extendPaidUntil } from '@tangobook/shared';
import { getSupabaseAdmin } from '../providers/supabase-admin.provider.js';
import { toss } from '../providers/toss.provider.js';
import { AppError } from '../middleware/error.middleware.js';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PaymentRow {
  id: string;
  order_id: string;
  account_id: string;
  plan: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed';
  payment_key?: string | null;
  paid_at?: string | null;
}

interface CheckoutResult {
  orderId: string;
  amount: number;
  orderName: string;
}

interface ConfirmArgs {
  paymentKey: string;
  orderId: string;
  amount: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function requireAdmin() {
  const admin = getSupabaseAdmin();
  if (!admin) throw new AppError(503, '결제 서비스를 사용할 수 없습니다 (Supabase 미설정)');
  return admin;
}

// ── createCheckout ─────────────────────────────────────────────────────────────

export async function createCheckout(accountId: string, planId: unknown): Promise<CheckoutResult> {
  if (!isPlanId(planId)) {
    throw new AppError(400, `올바르지 않은 플랜입니다: ${String(planId)}`);
  }

  const plan = PLANS[planId];
  const orderId = 'tb_' + crypto.randomUUID();

  const admin = requireAdmin();
  const { error } = await admin.from('payments').insert({
    account_id: accountId,
    order_id: orderId,
    plan: planId,
    amount: plan.amount,
    status: 'pending',
  });

  if (error) {
    throw new AppError(500, `주문 생성 실패: ${error.message}`);
  }

  return { orderId, amount: plan.amount, orderName: plan.name };
}

// ── extendEntitlementForPaidOrder ─────────────────────────────────────────────

/**
 * Idempotent: marks the payment as 'paid' and upserts the entitlement.
 * If the payment is already 'paid', returns immediately without any DB writes.
 */
export async function extendEntitlementForPaidOrder(
  paymentRow: PaymentRow,
  paymentKey: string
): Promise<void> {
  // Idempotency guard — already processed
  if (paymentRow.status === 'paid') return;

  const admin = requireAdmin();
  const plan = PLANS[paymentRow.plan as keyof typeof PLANS];
  if (!plan) throw new AppError(500, `알 수 없는 플랜: ${paymentRow.plan}`);

  const now = new Date().toISOString();

  // Conditional update: only flip pending → paid (avoids races)
  const { error: updateError } = await admin
    .from('payments')
    .update({ status: 'paid', payment_key: paymentKey, paid_at: now })
    .eq('order_id', paymentRow.order_id)
    .eq('status', 'pending');

  if (updateError) {
    throw new AppError(500, `결제 상태 업데이트 실패: ${updateError.message}`);
  }

  // Fetch current paid_until for the account
  const { data: existing } = await admin
    .from('entitlements')
    .select('paid_until')
    .eq('account_id', paymentRow.account_id)
    .maybeSingle();

  const currentPaidUntil = (existing as { paid_until?: string | null } | null)?.paid_until ?? null;
  const newPaidUntil = extendPaidUntil(currentPaidUntil, plan.days);

  const { error: upsertError } = await admin
    .from('entitlements')
    .upsert(
      { account_id: paymentRow.account_id, paid_until: newPaidUntil, updated_at: now },
      { onConflict: 'account_id' }
    );

  if (upsertError) {
    throw new AppError(500, `이용권 연장 실패: ${upsertError.message}`);
  }
}

// ── confirmPayment ────────────────────────────────────────────────────────────

export async function confirmPayment(
  accountId: string,
  args: ConfirmArgs
): Promise<{ paidUntil: string | null }> {
  const { paymentKey, orderId, amount } = args;
  const admin = requireAdmin();

  // 1. Fetch stored payment row
  const { data: row, error: fetchError } = await admin
    .from('payments')
    .select('*')
    .eq('order_id', orderId)
    .maybeSingle();

  if (fetchError || !row) {
    throw new AppError(404, '주문을 찾을 수 없습니다');
  }

  const paymentRow = row as PaymentRow;

  // 2. Authorization check
  if (paymentRow.account_id !== accountId) {
    throw new AppError(403, '권한이 없습니다');
  }

  // 3. Idempotency — already paid
  if (paymentRow.status === 'paid') {
    const { data: ent } = await admin
      .from('entitlements')
      .select('paid_until')
      .eq('account_id', accountId)
      .maybeSingle();
    return { paidUntil: (ent as { paid_until?: string | null } | null)?.paid_until ?? null };
  }

  // 4. Amount verification (re-check against DB — never trust client amount alone)
  if (amount !== paymentRow.amount) {
    throw new AppError(400, '금액 불일치');
  }

  // 5. Call Toss confirmation API
  await toss.confirmPayment({ paymentKey, orderId, amount });

  // 6. Extend entitlement
  await extendEntitlementForPaidOrder(paymentRow, paymentKey);

  // Return updated paid_until
  const { data: ent } = await admin
    .from('entitlements')
    .select('paid_until')
    .eq('account_id', accountId)
    .maybeSingle();
  return { paidUntil: (ent as { paid_until?: string | null } | null)?.paid_until ?? null };
}

// ── handleWebhook ─────────────────────────────────────────────────────────────

/**
 * Toss webhook backstop.
 * Only acts on DONE status; re-fetches the payment from Toss to verify before acting.
 */
export async function handleWebhook(body: unknown): Promise<void> {
  const event = body as {
    eventType?: string;
    data?: { paymentKey?: string; orderId?: string; status?: string };
  };

  const data = event?.data ?? (body as { paymentKey?: string; orderId?: string; status?: string });
  const { paymentKey, orderId, status } = data;

  // Only act on terminal DONE status
  if (status !== 'DONE') return;
  if (!paymentKey || !orderId) return;

  // Re-verify with Toss (don't trust webhook body alone)
  const tossPayment = await toss.getPayment(paymentKey);
  if (tossPayment.status !== 'DONE') return;

  const admin = requireAdmin();
  const { data: row } = await admin
    .from('payments')
    .select('*')
    .eq('order_id', orderId)
    .maybeSingle();

  if (!row) return; // unknown order — ignore

  const paymentRow = row as PaymentRow;

  // Amount cross-check
  if (tossPayment.totalAmount !== paymentRow.amount) return;

  await extendEntitlementForPaidOrder(paymentRow, paymentKey);
}
