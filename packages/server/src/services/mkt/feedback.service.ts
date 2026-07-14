import { getSupabaseAdmin } from '../../providers/supabase-admin.provider.js';

export interface FeedbackItem {
  id: string;
  message: string;
  contact: string | null;
  createdAt: string;
}

/**
 * 전체 건의 목록 (최신순). 여러 사용자가 각자 RLS own-row 로 남긴 건의를
 * 운영자가 한 곳에서 보려면 service-role 로 RLS 를 우회해야 한다.
 * Supabase admin 미설정 시 빈 배열(graceful).
 */
export async function listFeedback(limit = 500): Promise<FeedbackItem[]> {
  const admin = getSupabaseAdmin();
  if (!admin) return [];
  const { data, error } = await admin
    .from('app_feedback')
    .select('id, message, contact, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id as string,
    message: r.message as string,
    contact: (r.contact as string | null) ?? null,
    createdAt: r.created_at as string,
  }));
}
