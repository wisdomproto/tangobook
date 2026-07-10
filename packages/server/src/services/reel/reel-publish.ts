import fs from 'node:fs';
import { uploadBufferToR2 } from '../../providers/r2.provider.js';
import { getSupabaseAdmin } from '../../providers/supabase-admin.provider.js';

/** 렌더된 mp4 를 R2 에 업로드하고 공개 URL 반환. */
export async function uploadReelMp4(
  projectId: string,
  bookId: string,
  filePath: string
): Promise<string> {
  const buffer = fs.readFileSync(filePath);
  const key = `mkt/${projectId}/reels/${bookId}-${Date.now()}.mp4`;
  return uploadBufferToR2(buffer, key, 'video/mp4');
}

/** 렌더된 썸네일 PNG 를 R2 에 업로드하고 공개 URL 반환. */
export async function uploadThumbnail(
  projectId: string,
  bookId: string,
  filePath: string
): Promise<string> {
  const buffer = fs.readFileSync(filePath);
  const key = `mkt/${projectId}/reels/${bookId}-thumb-${Date.now()}.png`;
  return uploadBufferToR2(buffer, key, 'image/png');
}

function requireAdmin() {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error('Supabase admin 미설정 (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY 필요)');
  return sb;
}

/** 이메일 → Supabase auth user id (listUsers 페이징). */
export async function resolveOwnerUserId(email: string): Promise<string> {
  const sb = requireAdmin();
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`listUsers 실패: ${error.message}`);
    const found = data.users.find((u) => u.email === email);
    if (found) return found.id;
    if (data.users.length < 1000) break;
  }
  throw new Error(`소유자 미발견: ${email}`);
}

export interface MarketingTarget {
  contentId: string;
  projectId: string;
  igRow: any | null;
}

/** bookId → 마케팅 콘텐츠(mkt_contents.memo='storybook:<id>') + 인스타 캐러셀 행. 없으면 null. */
export async function resolveMarketingTarget(bookId: string): Promise<MarketingTarget | null> {
  const sb = requireAdmin();
  const { data: content, error: cErr } = await sb
    .from('mkt_contents')
    .select('id, project_id')
    .eq('memo', `storybook:${bookId}`)
    .maybeSingle();
  if (cErr) throw new Error(`mkt_contents 조회 실패(${bookId}): ${cErr.message}`);
  if (!content) return null;

  const { data: igRows, error: igErr } = await sb
    .from('mkt_instagram_contents')
    .select('*')
    .eq('content_id', content.id)
    .order('created_at')
    .limit(1);
  if (igErr) throw new Error(`mkt_instagram_contents 조회 실패(${bookId}): ${igErr.message}`);

  return {
    contentId: content.id,
    projectId: content.project_id,
    igRow: igRows && igRows.length ? igRows[0] : null,
  };
}

/**
 * 릴스 URL 을 마케팅 인스타 행의 video_settings.reels.ko 에 연결.
 * - 마케팅 콘텐츠 없음 → 'skipped'
 * - 인스타 행 있음 → video_settings 병합 update → 'updated' (절대 2번째 행 생성 X)
 * - 인스타 행 없음 → insert → 'inserted'
 */
export async function connectReelToMarketing({
  bookId,
  videoUrl,
  coverUrl,
  ownerUserId,
}: {
  bookId: string;
  videoUrl: string;
  coverUrl: string;
  ownerUserId: string;
}): Promise<'updated' | 'inserted' | 'skipped'> {
  const sb = requireAdmin();
  const target = await resolveMarketingTarget(bookId);
  if (!target) {
    console.log(`[reel-publish] 마케팅 콘텐츠 없음(${bookId}) — skip`);
    return 'skipped';
  }

  const now = new Date().toISOString();
  const reelEntry = { videoUrl, coverUrl };

  if (target.igRow) {
    const vs = (target.igRow.video_settings as Record<string, any> | null) ?? {};
    const nextVs = { ...vs, reels: { ...(vs.reels ?? {}), ko: reelEntry } };
    const { error } = await sb
      .from('mkt_instagram_contents')
      .update({ video_settings: nextVs, updated_at: now })
      .eq('id', target.igRow.id);
    if (error) throw new Error(`인스타 video_settings 갱신 실패(${bookId}): ${error.message}`);
    return 'updated';
  }

  const { error } = await sb.from('mkt_instagram_contents').insert({
    content_id: target.contentId,
    user_id: ownerUserId,
    content_type: 'carousel',
    video_settings: { reels: { ko: reelEntry } },
    status: 'draft',
    created_at: now,
    updated_at: now,
  });
  if (error) throw new Error(`인스타 콘텐츠 생성 실패(${bookId}): ${error.message}`);
  return 'inserted';
}

/**
 * 기존 릴스의 coverUrl(썸네일)만 교체. **videoUrl 은 그대로 유지**(영상 재렌더 없이 썸네일만 갱신).
 * 인스타 행/기존 reels.ko 없으면 'skipped'.
 */
export async function updateReelCover({
  bookId,
  coverUrl,
}: {
  bookId: string;
  coverUrl: string;
}): Promise<'updated' | 'skipped'> {
  const sb = requireAdmin();
  const target = await resolveMarketingTarget(bookId);
  if (!target?.igRow) return 'skipped';
  const vs = (target.igRow.video_settings as Record<string, any> | null) ?? {};
  const ko = (vs.reels?.ko as Record<string, any> | undefined) ?? {};
  const nextVs = { ...vs, reels: { ...(vs.reels ?? {}), ko: { ...ko, coverUrl } } };
  const { error } = await sb
    .from('mkt_instagram_contents')
    .update({ video_settings: nextVs, updated_at: new Date().toISOString() })
    .eq('id', target.igRow.id);
  if (error) throw new Error(`썸네일 coverUrl 갱신 실패(${bookId}): ${error.message}`);
  return 'updated';
}
