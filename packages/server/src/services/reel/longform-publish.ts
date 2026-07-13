import { getSupabaseAdmin } from '../../providers/supabase-admin.provider.js';
import { resolveMarketingTarget, resolveOwnerUserId } from './reel-publish.js';

export { resolveOwnerUserId };

export interface YoutubeRowLike {
  id: string;
  video_settings: Record<string, any> | null;
}

/**
 * mkt_youtube_contents 행들 중 (artStyle, language) 조합이 일치하는 행을 찾는다.
 * 조합당 1행 보장(중복 생성 방지)에 쓰인다. 없으면 null.
 */
export function matchYoutubeRow<T extends YoutubeRowLike>(
  rows: T[],
  artStyle: string,
  language: string
): T | null {
  return (
    rows.find(
      (r) => r.video_settings?.artStyle === artStyle && r.video_settings?.language === language
    ) ?? null
  );
}

export interface LongformMeta {
  title: string;
  description: string;
  tags: string[];
  categoryId: string;
}

/**
 * 렌더된 롱폼 오디오북 영상을 마케팅 롱폼 탭(mkt_youtube_contents)에 등록.
 * - mkt_contents(memo='storybook:<bookId>') 없으면 'skipped'
 * - 같은 (artStyle, language) 행 있으면 update, 없으면 insert (조합당 1행)
 */
export async function connectLongformToMarketing(input: {
  bookId: string;
  artStyle: string;
  language: string;
  aspectRatio: string;
  videoUrl: string;
  thumbnailUrl: string;
  meta: LongformMeta;
  captions: Record<string, string>;
  ownerUserId: string;
}): Promise<'updated' | 'inserted' | 'skipped'> {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error('Supabase admin 미설정 (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY 필요)');

  const target = await resolveMarketingTarget(input.bookId);
  if (!target) return 'skipped';

  const { data: rows, error: selErr } = await sb
    .from('mkt_youtube_contents')
    .select('id, video_settings')
    .eq('content_id', target.contentId);
  if (selErr) throw new Error(`mkt_youtube_contents 조회 실패(${input.bookId}): ${selErr.message}`);

  const existing = matchYoutubeRow(rows ?? [], input.artStyle, input.language);
  const now = new Date().toISOString();
  const payload = {
    video_url: input.videoUrl,
    thumbnail_url: input.thumbnailUrl,
    video_title: input.meta.title,
    video_description: input.meta.description,
    video_tags: input.meta.tags,
    video_category: input.meta.categoryId,
    target_duration: 'long',
    status: 'draft',
    video_settings: {
      bookId: input.bookId,
      artStyle: input.artStyle,
      language: input.language,
      aspectRatio: input.aspectRatio,
      captions: input.captions,
    },
    updated_at: now,
  };

  if (existing) {
    const { error } = await sb.from('mkt_youtube_contents').update(payload).eq('id', existing.id);
    if (error) throw new Error(`youtube 행 갱신 실패(${input.bookId}): ${error.message}`);
    return 'updated';
  }

  const { error } = await sb.from('mkt_youtube_contents').insert({
    ...payload,
    content_id: target.contentId,
    user_id: input.ownerUserId,
    created_at: now,
  });
  if (error) throw new Error(`youtube 행 생성 실패(${input.bookId}): ${error.message}`);
  return 'inserted';
}
