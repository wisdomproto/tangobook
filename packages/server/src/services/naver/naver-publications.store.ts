import { getSupabaseAdmin } from '../../providers/supabase-admin.provider.js';

export interface PublicationRow {
  book_id: string;
  post_id: string;
  language: string;
  status: 'draft' | 'published' | 'failed';
  naver_post_url: string | null;
}

/** 실행 모드 — dry 는 이력을 건드리지 않으므로 skip 판정 대상이 아니다. */
export type PublishMode = 'draft' | 'publish';

const TABLE = 'mkt_naver_blog_publications';

/**
 * 멱등 skip 판정.
 * - published 는 어느 모드든 skip(이미 발행됨).
 * - draft 모드에선 draft 도 skip → 재실행 시 중복 초안 방지.
 * - failed 는 어느 모드든 재시도.
 */
export function shouldSkip(existing: PublicationRow | null, mode: PublishMode): boolean {
  if (!existing) return false;
  if (existing.status === 'published') return true;
  if (mode === 'draft' && existing.status === 'draft') return true;
  return false;
}

export async function findPublication(
  bookId: string,
  postId: string,
  language: string
): Promise<PublicationRow | null> {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error('Supabase 서비스 키 미설정 — 이력 조회 불가');
  const { data } = await sb
    .from(TABLE)
    .select('book_id, post_id, language, status, naver_post_url')
    .eq('book_id', bookId)
    .eq('post_id', postId)
    .eq('language', language)
    .maybeSingle();
  return (data as PublicationRow | null) ?? null;
}

export async function recordPublication(input: {
  bookId: string;
  postId: string;
  language: string;
  status: 'draft' | 'published' | 'failed';
  naverPostUrl?: string;
  error?: string;
}): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error('Supabase 서비스 키 미설정 — 이력 기록 불가');
  const nowIso = new Date().toISOString();
  const { error } = await sb.from(TABLE).upsert(
    {
      book_id: input.bookId,
      post_id: input.postId,
      language: input.language,
      status: input.status,
      naver_post_url: input.naverPostUrl ?? null,
      error_message: input.error ?? null,
      published_at: input.status === 'published' ? nowIso : null,
      updated_at: nowIso,
    },
    { onConflict: 'book_id,post_id,language' }
  );
  if (error) throw new Error(error.message);
}
