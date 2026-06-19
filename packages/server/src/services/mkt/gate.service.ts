import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '../../providers/supabase-admin.provider.js';
import { config } from '../../config/index.js';
import { AppError } from '../../middleware/error.middleware.js';

/** 게이트 코드 검증(순수). expected 미설정('')이면 항상 false. */
export function isValidGateCode(input: string | undefined, expected: string): boolean {
  if (!expected) return false;
  return (input ?? '').trim() === expected;
}

/**
 * 고정 소유자 계정(config.mkt.ownerEmail)의 Supabase 세션을 발급한다.
 * service-role로 magiclink OTP 를 생성 → anon 클라이언트로 verifyOtp → 세션 토큰.
 * 계정 비밀번호 불필요(클라이언트 번들에 비번 미노출).
 */
export async function mintOwnerSession(): Promise<{ access_token: string; refresh_token: string }> {
  const admin = getSupabaseAdmin();
  if (!admin) throw new AppError(502, 'Supabase 관리자 클라이언트가 설정되지 않았습니다.');
  const email = config.mkt.ownerEmail;
  if (!email) throw new AppError(502, 'MKT_OWNER_EMAIL 미설정.');
  if (!config.supabase.anonKey) throw new AppError(502, 'SUPABASE_ANON_KEY 미설정.');

  const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email });
  if (error || !data?.properties?.hashed_token) {
    throw new AppError(502, `세션 발급 실패(generateLink): ${error?.message ?? 'no hashed_token'}`);
  }

  const anon = createClient(config.supabase.url, config.supabase.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const verify = await anon.auth.verifyOtp({
    type: 'magiclink',
    token_hash: data.properties.hashed_token,
  });
  if (verify.error || !verify.data?.session) {
    throw new AppError(502, `세션 발급 실패(verifyOtp): ${verify.error?.message ?? 'no session'}`);
  }
  const { access_token, refresh_token } = verify.data.session;
  return { access_token, refresh_token };
}
