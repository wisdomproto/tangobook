import { getSupabaseAdmin } from '../../providers/supabase-admin.provider.js';
import { deleteFromR2, urlToR2Key } from '../../providers/r2.provider.js';
import { resolveMarketingTarget, resolveOwnerUserId } from './reel-publish.js';

export { resolveOwnerUserId };

export interface YoutubeRowLike {
  id: string;
  video_settings: Record<string, any> | null;
  video_url?: string | null;
  thumbnail_url?: string | null;
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
 * 롱폼 썸네일용 언어별 표지 URL.
 * 언어별 구운 표지(primaryCoverByLang[lang])가 있으면 그것, 없으면 그림체 표지 → 책 대표 표지 폴백.
 * (별도 썸네일 렌더 대신 실제 표지 이미지를 썸네일로 씀 — 파이프라인·백필 공용.)
 */
export function resolveLongformCoverUrl(
  storybook: any,
  artStyle: string,
  language: string
): string {
  const sa = storybook?.styleAssets?.[artStyle] ?? {};
  return sa.primaryCoverByLang?.[language] || sa.coverImage || storybook?.coverImage || '';
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
    .select('id, video_settings, video_url, thumbnail_url')
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
    // 이전 R2 영상/썸네일 정리 (새 URL 과 다를 때만) — 재렌더 시 orphan 누적 방지.
    for (const oldUrl of [existing.video_url, existing.thumbnail_url]) {
      if (oldUrl && oldUrl !== input.videoUrl && oldUrl !== input.thumbnailUrl) {
        try {
          await deleteFromR2(urlToR2Key(oldUrl));
        } catch {
          /* 이미 없을 수 있음 — 무시 */
        }
      }
    }
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
