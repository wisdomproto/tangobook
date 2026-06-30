import crypto from 'node:crypto';
import { getSupabaseAdmin } from '../providers/supabase-admin.provider.js';
import { AppError } from '../middleware/error.middleware.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function requireAdmin() {
  const admin = getSupabaseAdmin();
  if (!admin) throw new AppError(503, '추천인 서비스를 사용할 수 없습니다 (Supabase 미설정)');
  return admin;
}

/** Generate a short base36 referral code from random bytes (8 chars). */
function generateCode(): string {
  const bytes = crypto.randomBytes(6);
  return Buffer.from(bytes).readUIntBE(0, 6).toString(36).padStart(8, '0').slice(-8);
}

// ── ensureReferralCode ────────────────────────────────────────────────────────

/**
 * Returns the referral code for the account.
 * If the entitlement row is missing or the code is null, generates a new code
 * and upserts it. Retries up to 3 times on unique-constraint violations.
 */
export async function ensureReferralCode(accountId: string): Promise<string> {
  const admin = requireAdmin();

  // Check existing code
  const { data: existing } = await admin
    .from('entitlements')
    .select('referral_code')
    .eq('account_id', accountId)
    .maybeSingle();

  const existingCode = (existing as { referral_code?: string | null } | null)?.referral_code;
  if (existingCode) return existingCode;

  // Generate and upsert with retry on unique violation
  const MAX_ATTEMPTS = 3;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const code = generateCode();

    const { error } = await admin
      .from('entitlements')
      .upsert(
        { account_id: accountId, referral_code: code, updated_at: new Date().toISOString() },
        { onConflict: 'account_id' }
      );

    if (!error) return code;

    // Check if it's a unique-constraint violation on referral_code (code collision)
    const isUniqueViolation =
      error.code === '23505' ||
      (error.message ?? '').toLowerCase().includes('unique') ||
      (error.message ?? '').toLowerCase().includes('duplicate');

    if (!isUniqueViolation || attempt === MAX_ATTEMPTS - 1) {
      throw new AppError(500, `추천 코드 생성 실패: ${error.message}`);
    }
    // On unique violation, regenerate with a new code
  }

  // Should not reach here
  throw new AppError(500, '추천 코드 생성에 실패했습니다');
}

// ── redeemReferral ────────────────────────────────────────────────────────────

export interface RedeemResult {
  ok: boolean;
  reason?: string;
  inviterBonus?: number;
}

/**
 * Redeems a referral code for a new account.
 * All guards (self-referral, already-referred, cap at 28 days) are enforced
 * atomically in the SQL RPC `redeem_referral`.
 */
export async function redeemReferral(newAccountId: string, code: string): Promise<RedeemResult> {
  const admin = requireAdmin();

  const { data, error } = await admin.rpc('redeem_referral', {
    p_new_account: newAccountId,
    p_code: code,
  });

  if (error) {
    throw new AppError(500, `추천 코드 적용 실패: ${error.message}`);
  }

  return data as RedeemResult;
}
