import { Request } from 'express';
import { getSupabaseAdmin } from '../providers/supabase-admin.provider.js';
import { AppError } from './error.middleware.js';

/**
 * Extracts and verifies the Bearer token from the Authorization header.
 * Returns the verified account_id (Supabase user.id).
 * Never trusts account_id from the request body.
 */
export async function getAccountIdFromRequest(req: Request): Promise<string> {
  const authHeader = req.headers.authorization ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token) {
    throw new AppError(401, '인증이 필요합니다');
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    throw new AppError(503, 'Auth 서비스를 사용할 수 없습니다');
  }

  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) {
    throw new AppError(401, '인증이 필요합니다');
  }

  return data.user.id;
}
