import type { Request, Response, NextFunction } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { getSupabaseAdmin } from '../providers/supabase-admin.provider.js';
import { AppError } from './error.middleware.js';

/**
 * 운영 대시보드 접근 — 둘 중 하나면 통과:
 *  (a) x-ops-password 헤더 = 운영 비밀번호 (env OPS_PASSWORD, 기본 8054)
 *  (b) Bearer 토큰의 이메일이 allowlist (env OPS_EMAILS, 기본 kil210)
 * 비밀번호는 서버에서만 비교 — 클라 번들에 포함되지 않음.
 */
const OPS_PASSWORD = process.env.OPS_PASSWORD ?? '8054';
const OPS_EMAILS = (process.env.OPS_EMAILS ?? 'kil210@tangobook.co.kr')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);
// 마케팅 게이트(8054) 통과 시 owner 계정(MKT_OWNER_EMAIL) 세션으로 로그인된다.
// 같은 운영자가 회원 관리(/marketing/members)도 볼 수 있도록 owner 이메일을 allowlist 에 자동 포함.
const MKT_OWNER_EMAIL = process.env.MKT_OWNER_EMAIL?.trim().toLowerCase();
const ALLOWED_OPS_EMAILS = MKT_OWNER_EMAIL
  ? [...new Set([...OPS_EMAILS, MKT_OWNER_EMAIL])]
  : OPS_EMAILS;

/** 타이밍 공격 방어 비교 — 길이 다르면 timingSafeEqual 없이 즉시 false. */
function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** 운영 대시보드 접근 검증 — (a) x-ops-password 헤더 (b) Bearer 이메일 allowlist. */
export async function assertOpsUser(req: Request): Promise<void> {
  // (a) 운영 비밀번호
  const pw = req.headers['x-ops-password'];
  if (typeof pw === 'string' && pw.length > 0) {
    // 기본 비밀번호(8054)는 프로덕션에서 회원 데이터를 보호하기엔 부족함 — env 미설정 시 차단.
    if (process.env.NODE_ENV === 'production' && !process.env.OPS_PASSWORD) {
      throw new AppError(403, '운영 비밀번호가 설정되지 않았습니다');
    }
    if (safeCompare(pw, OPS_PASSWORD)) return;
    throw new AppError(403, '비밀번호가 틀렸습니다');
  }

  // (b) 로그인 세션 + 이메일 allowlist
  const authHeader = req.headers.authorization ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) throw new AppError(401, '인증이 필요합니다');

  const admin = getSupabaseAdmin();
  if (!admin) throw new AppError(503, 'Auth 서비스를 사용할 수 없습니다');

  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) throw new AppError(401, '인증이 필요합니다');

  const email = data.user.email?.toLowerCase() ?? '';
  if (!ALLOWED_OPS_EMAILS.includes(email)) throw new AppError(403, '접근 권한이 없습니다');
}

/** ops 계열 라우트 공용 인증 미들웨어 — 비번(x-ops-password) 또는 OPS_EMAILS 로그인. */
export async function opsAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    await assertOpsUser(req);
    next();
  } catch (err) {
    next(err);
  }
}
