import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock providers ────────────────────────────────────────────────────────────
vi.mock('../providers/supabase-admin.provider.js', () => ({
  getSupabaseAdmin: vi.fn(),
}));
vi.mock('../providers/toss.provider.js', () => ({
  toss: {
    confirmPayment: vi.fn(),
    getPayment: vi.fn(),
  },
}));

import { getSupabaseAdmin } from '../providers/supabase-admin.provider.js';
import { toss } from '../providers/toss.provider.js';
import {
  createCheckout,
  confirmPayment,
  extendEntitlementForPaidOrder,
  handleWebhook,
} from './payment.service.js';
import { AppError } from '../middleware/error.middleware.js';
import { PLANS } from '@tangobook/shared';

// ── Fake Supabase builder ─────────────────────────────────────────────────────
// Models the supabase-js builder: chainable + thenable. Resolves canned data.

interface OpLog {
  table: string;
  op: 'insert' | 'update' | 'upsert' | 'select' | null;
  payload?: unknown;
  upsertOpts?: unknown;
  selectCols?: string;
  eq: Array<[string, unknown]>;
  singleMode: boolean;
}

interface Seed {
  paymentRow?: Record<string, unknown> | null; // returned by select on payments
  entitlementRow?: Record<string, unknown> | null; // returned by select on entitlements
  insertError?: { message: string } | null;
  updateError?: { message: string } | null;
  upsertError?: { message: string } | null;
  // Rows returned by the conditional `payments.update(...).select('order_id')`.
  // [] = lost the race (0 rows flipped). Defaults to one synthetic row when the
  // stored payment is pending, so existing happy-path tests keep extending.
  flippedRows?: Array<Record<string, unknown>>;
}

interface FakeAdmin {
  client: { from: (table: string) => unknown };
  ops: OpLog[];
}

function makeFakeAdmin(seed: Seed = {}): FakeAdmin {
  const ops: OpLog[] = [];

  function from(table: string) {
    const log: OpLog = { table, op: null, eq: [], singleMode: false };
    ops.push(log);

    function resolve(): { data: unknown; error: unknown } {
      if (table === 'payments') {
        if (log.op === 'insert') {
          return { data: null, error: seed.insertError ?? null };
        }
        if (log.op === 'update') {
          // Conditional flip with trailing `.select('order_id')` returns the
          // affected rows. Default: one synthetic row when the stored payment is
          // pending (so it "won" the flip); [] when explicitly seeded as lost.
          const defaultFlipped =
            (seed.paymentRow as { status?: string } | null)?.status === 'pending'
              ? [{ order_id: (seed.paymentRow as { order_id?: string })?.order_id ?? 'tb_x' }]
              : [];
          return {
            data: seed.flippedRows ?? defaultFlipped,
            error: seed.updateError ?? null,
          };
        }
        if (log.op === 'select') {
          return { data: seed.paymentRow ?? null, error: null };
        }
      }
      if (table === 'entitlements') {
        if (log.op === 'select') {
          return { data: seed.entitlementRow ?? null, error: null };
        }
        if (log.op === 'upsert') {
          return { data: null, error: seed.upsertError ?? null };
        }
      }
      return { data: null, error: null };
    }

    const builder: Record<string, unknown> = {
      insert(payload: unknown) {
        log.op = 'insert';
        log.payload = payload;
        return builder;
      },
      update(payload: unknown) {
        log.op = 'update';
        log.payload = payload;
        return builder;
      },
      upsert(payload: unknown, opts?: unknown) {
        log.op = 'upsert';
        log.payload = payload;
        log.upsertOpts = opts;
        return builder;
      },
      select(cols?: string) {
        if (log.op === null) log.op = 'select';
        log.selectCols = cols;
        return builder;
      },
      eq(col: string, val: unknown) {
        log.eq.push([col, val]);
        return builder;
      },
      single() {
        log.singleMode = true;
        return Promise.resolve(resolve());
      },
      maybeSingle() {
        log.singleMode = true;
        return Promise.resolve(resolve());
      },
      // Thenable — await builder runs the query
      then(onFulfilled: (v: unknown) => unknown, onRejected: (e: unknown) => unknown) {
        return Promise.resolve(resolve()).then(onFulfilled, onRejected);
      },
    };
    return builder;
  }

  return { client: { from } as { from: (t: string) => unknown }, ops };
}

// ─────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

// ══ 1. createCheckout ═════════════════════════════════════════════════════════
describe('createCheckout', () => {
  it('throws AppError(400) for invalid planId', async () => {
    const fake = makeFakeAdmin();
    (getSupabaseAdmin as ReturnType<typeof vi.fn>).mockReturnValue(fake.client);

    await expect(createCheckout('acc-1', 'invalid_plan')).rejects.toMatchObject({
      statusCode: 400,
    });

    // No DB writes
    expect(fake.ops.some((o) => o.op === 'insert')).toBe(false);
  });

  it('inserts a pending row and returns {orderId, amount, orderName} for month1', async () => {
    const fake = makeFakeAdmin();
    (getSupabaseAdmin as ReturnType<typeof vi.fn>).mockReturnValue(fake.client);

    const result = await createCheckout('acc-1', 'month1');

    // Amount must come from PLANS
    expect(result.amount).toBe(PLANS.month1.amount);
    expect(result.orderName).toBe(PLANS.month1.name);
    expect(result.orderId).toMatch(/^tb_/);

    // DB: insert on 'payments' table with pending status
    const insertOp = fake.ops.find((o) => o.table === 'payments' && o.op === 'insert');
    expect(insertOp).toBeDefined();
    const row = insertOp!.payload as Record<string, unknown>;
    expect(row.account_id).toBe('acc-1');
    expect(row.plan).toBe('month1');
    expect(row.amount).toBe(PLANS.month1.amount);
    expect(row.status).toBe('pending');
    expect(row.order_id).toBe(result.orderId);
  });

  it('inserts correct amount for year1', async () => {
    const fake = makeFakeAdmin();
    (getSupabaseAdmin as ReturnType<typeof vi.fn>).mockReturnValue(fake.client);

    const result = await createCheckout('acc-2', 'year1');

    expect(result.amount).toBe(PLANS.year1.amount);
    expect(result.orderName).toBe(PLANS.year1.name);

    const insertOp = fake.ops.find((o) => o.table === 'payments' && o.op === 'insert');
    const row = insertOp!.payload as Record<string, unknown>;
    expect(row.plan).toBe('year1');
    expect(row.amount).toBe(PLANS.year1.amount);
  });
});

// ══ 2. confirmPayment — amount mismatch ═══════════════════════════════════════
describe('confirmPayment — amount mismatch', () => {
  it('throws AppError(400) when request amount differs from stored amount; toss NOT called', async () => {
    const storedRow = {
      id: 'row-1',
      order_id: 'tb_order-1',
      account_id: 'acc-1',
      plan: 'month1',
      amount: PLANS.month1.amount, // 9900
      status: 'pending',
    };
    const fake = makeFakeAdmin({ paymentRow: storedRow });
    (getSupabaseAdmin as ReturnType<typeof vi.fn>).mockReturnValue(fake.client);

    await expect(
      confirmPayment('acc-1', {
        paymentKey: 'pk_test_xxx',
        orderId: 'tb_order-1',
        amount: 1000, // wrong amount
      })
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(toss.confirmPayment).not.toHaveBeenCalled();
  });
});

// ══ 3. confirmPayment — foreign account ═══════════════════════════════════════
describe('confirmPayment — foreign account_id', () => {
  it('throws AppError(403) when account_id does not match stored row', async () => {
    const storedRow = {
      id: 'row-2',
      order_id: 'tb_order-2',
      account_id: 'acc-owner', // real owner
      plan: 'month1',
      amount: PLANS.month1.amount,
      status: 'pending',
    };
    const fake = makeFakeAdmin({ paymentRow: storedRow });
    (getSupabaseAdmin as ReturnType<typeof vi.fn>).mockReturnValue(fake.client);

    await expect(
      confirmPayment('acc-attacker', {
        paymentKey: 'pk_test_yyy',
        orderId: 'tb_order-2',
        amount: PLANS.month1.amount,
      })
    ).rejects.toMatchObject({ statusCode: 403 });

    expect(toss.confirmPayment).not.toHaveBeenCalled();
  });
});

// ══ 4. confirmPayment — happy path ════════════════════════════════════════════
describe('confirmPayment — happy path', () => {
  it('calls toss.confirmPayment once, marks payment paid, upserts entitlement', async () => {
    const storedRow = {
      id: 'row-3',
      order_id: 'tb_order-3',
      account_id: 'acc-1',
      plan: 'month1',
      amount: PLANS.month1.amount,
      status: 'pending',
    };
    const fake = makeFakeAdmin({
      paymentRow: storedRow,
      entitlementRow: { account_id: 'acc-1', paid_until: null },
    });
    (getSupabaseAdmin as ReturnType<typeof vi.fn>).mockReturnValue(fake.client);
    (toss.confirmPayment as ReturnType<typeof vi.fn>).mockResolvedValue({
      paymentKey: 'pk_live_abc',
      status: 'DONE',
    });

    await confirmPayment('acc-1', {
      paymentKey: 'pk_live_abc',
      orderId: 'tb_order-3',
      amount: PLANS.month1.amount,
    });

    // Toss called once with correct args
    expect(toss.confirmPayment).toHaveBeenCalledTimes(1);
    expect(toss.confirmPayment).toHaveBeenCalledWith({
      paymentKey: 'pk_live_abc',
      orderId: 'tb_order-3',
      amount: PLANS.month1.amount,
    });

    // Payment row updated to 'paid'
    const updateOp = fake.ops.find((o) => o.table === 'payments' && o.op === 'update');
    expect(updateOp).toBeDefined();
    const updatePayload = updateOp!.payload as Record<string, unknown>;
    expect(updatePayload.status).toBe('paid');
    expect(updatePayload.payment_key).toBe('pk_live_abc');
    expect(updatePayload.paid_at).toBeDefined();

    // Entitlement upserted with extended paid_until
    const upsertOp = fake.ops.find((o) => o.table === 'entitlements' && o.op === 'upsert');
    expect(upsertOp).toBeDefined();
    const upsertPayload = upsertOp!.payload as Record<string, unknown>;
    expect(upsertPayload.account_id).toBe('acc-1');
    expect(typeof upsertPayload.paid_until).toBe('string');
    // paid_until should be ~30 days from now
    const paidUntilMs = Date.parse(upsertPayload.paid_until as string);
    const nowMs = Date.now();
    const diffDays = (paidUntilMs - nowMs) / 86_400_000;
    expect(diffDays).toBeGreaterThan(28);
    expect(diffDays).toBeLessThan(32);
  });
});

// ══ 5. confirmPayment — idempotent (already paid) ════════════════════════════
describe('confirmPayment — idempotent', () => {
  it('does NOT call toss when order is already paid; does not double-extend entitlement', async () => {
    const storedRow = {
      id: 'row-4',
      order_id: 'tb_order-4',
      account_id: 'acc-1',
      plan: 'month1',
      amount: PLANS.month1.amount,
      status: 'paid', // already done
      payment_key: 'pk_live_existing',
    };
    const fake = makeFakeAdmin({ paymentRow: storedRow });
    (getSupabaseAdmin as ReturnType<typeof vi.fn>).mockReturnValue(fake.client);

    await confirmPayment('acc-1', {
      paymentKey: 'pk_live_existing',
      orderId: 'tb_order-4',
      amount: PLANS.month1.amount,
    });

    // Toss must NOT be called
    expect(toss.confirmPayment).not.toHaveBeenCalled();

    // No update or upsert — just returns early
    expect(fake.ops.some((o) => o.op === 'update')).toBe(false);
    expect(fake.ops.some((o) => o.op === 'upsert')).toBe(false);
  });
});

// ══ 6. webhook — idempotent (already paid) ════════════════════════════════════
describe('handleWebhook — idempotent on already-paid order', () => {
  it('does NOT double-extend entitlement when order is already paid', async () => {
    const storedRow = {
      id: 'row-5',
      order_id: 'tb_order-5',
      account_id: 'acc-1',
      plan: 'month1',
      amount: PLANS.month1.amount,
      status: 'paid', // already done
    };
    const fake = makeFakeAdmin({ paymentRow: storedRow });
    (getSupabaseAdmin as ReturnType<typeof vi.fn>).mockReturnValue(fake.client);
    (toss.getPayment as ReturnType<typeof vi.fn>).mockResolvedValue({
      paymentKey: 'pk_live_webhook',
      status: 'DONE',
      orderId: 'tb_order-5',
      totalAmount: PLANS.month1.amount,
    });

    await handleWebhook({
      eventType: 'PAYMENT_STATUS_CHANGED',
      data: {
        paymentKey: 'pk_live_webhook',
        orderId: 'tb_order-5',
        status: 'DONE',
      },
    });

    // getPayment WAS called to verify
    expect(toss.getPayment).toHaveBeenCalledWith('pk_live_webhook');

    // But no upsert/update — idempotent guard stops it
    expect(fake.ops.some((o) => o.op === 'update')).toBe(false);
    expect(fake.ops.some((o) => o.op === 'upsert')).toBe(false);
  });

  it('no-ops for non-DONE webhook status (does not call getPayment)', async () => {
    const fake = makeFakeAdmin();
    (getSupabaseAdmin as ReturnType<typeof vi.fn>).mockReturnValue(fake.client);

    await handleWebhook({
      eventType: 'PAYMENT_STATUS_CHANGED',
      data: {
        paymentKey: 'pk_test_pending',
        orderId: 'tb_order-6',
        status: 'IN_PROGRESS',
      },
    });

    expect(toss.getPayment).not.toHaveBeenCalled();
    expect(fake.ops.length).toBe(0);
  });
});

// ══ 7. extendEntitlementForPaidOrder — concurrency (winning the flip) ══════════
describe('extendEntitlementForPaidOrder — gated on winning the paid flip', () => {
  const pendingRow = {
    id: 'row-7',
    order_id: 'tb_order-7',
    account_id: 'acc-1',
    plan: 'month1' as const,
    amount: PLANS.month1.amount,
    status: 'pending' as const,
  };

  it('extends the entitlement when the conditional flip affects a row (winner)', async () => {
    const fake = makeFakeAdmin({
      paymentRow: pendingRow,
      flippedRows: [{ order_id: 'tb_order-7' }], // won: 1 row flipped
      entitlementRow: { account_id: 'acc-1', paid_until: null },
    });
    (getSupabaseAdmin as ReturnType<typeof vi.fn>).mockReturnValue(fake.client);

    await extendEntitlementForPaidOrder(pendingRow, 'pk_live_winner');

    // The conditional update ran with the trailing .select('order_id')
    const updateOp = fake.ops.find((o) => o.table === 'payments' && o.op === 'update');
    expect(updateOp).toBeDefined();
    expect(updateOp!.selectCols).toBe('order_id');

    // Winner extends the entitlement exactly once
    const upserts = fake.ops.filter((o) => o.table === 'entitlements' && o.op === 'upsert');
    expect(upserts).toHaveLength(1);
  });

  it('does NOT extend the entitlement when the flip affects 0 rows (lost the race)', async () => {
    const fake = makeFakeAdmin({
      paymentRow: pendingRow,
      flippedRows: [], // lost: another concurrent call already flipped pending→paid
      entitlementRow: { account_id: 'acc-1', paid_until: null },
    });
    (getSupabaseAdmin as ReturnType<typeof vi.fn>).mockReturnValue(fake.client);

    await extendEntitlementForPaidOrder(pendingRow, 'pk_live_loser');

    // Update was attempted (the flip) …
    expect(fake.ops.some((o) => o.table === 'payments' && o.op === 'update')).toBe(true);
    // … but NO entitlement upsert — the loser must not double-extend.
    expect(fake.ops.some((o) => o.table === 'entitlements' && o.op === 'upsert')).toBe(false);
  });

  it('extends exactly once across concurrent winner + loser calls (no double extension)', async () => {
    // Winner: flip returns 1 row.
    const winnerFake = makeFakeAdmin({
      paymentRow: pendingRow,
      flippedRows: [{ order_id: 'tb_order-7' }],
      entitlementRow: { account_id: 'acc-1', paid_until: null },
    });
    // Loser: same order, but the conditional flip returns 0 rows.
    const loserFake = makeFakeAdmin({
      paymentRow: pendingRow,
      flippedRows: [],
      entitlementRow: { account_id: 'acc-1', paid_until: null },
    });

    // Winner runs against its client, loser against its client (each models one
    // of the two concurrent callers hitting the same DB row).
    (getSupabaseAdmin as ReturnType<typeof vi.fn>).mockReturnValue(winnerFake.client);
    await extendEntitlementForPaidOrder(pendingRow, 'pk_live_winner');

    (getSupabaseAdmin as ReturnType<typeof vi.fn>).mockReturnValue(loserFake.client);
    await extendEntitlementForPaidOrder(pendingRow, 'pk_live_loser');

    const winnerUpserts = winnerFake.ops.filter(
      (o) => o.table === 'entitlements' && o.op === 'upsert'
    );
    const loserUpserts = loserFake.ops.filter(
      (o) => o.table === 'entitlements' && o.op === 'upsert'
    );

    // Exactly-once: only the winner upserts the entitlement.
    expect(winnerUpserts).toHaveLength(1);
    expect(loserUpserts).toHaveLength(0);
  });
});
