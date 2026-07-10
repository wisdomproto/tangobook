// 발행 레코드 1건을 실제 Meta(IG/FB/Threads) 로 발행하는 공용 실행기. 수동(/publish/run)·자동(scheduler) 공용.
// dflo(ai-server/services/publishExecutor.ts)에서 이식 — tangobook 스키마(mkt_publish_records +
// mkt_instagram_contents/cards)에 맞춰 적응. self_hosted(website)는 기존 스케줄러가 담당하므로 여기선
// meta 채널만 처리한다. 타겟 id/콘텐츠 종류는 레코드 metadata 에 담겨 온다(별도 채널 테이블 없음).
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '../../providers/supabase-admin.provider.js';
import { validatePublish, type Platform } from './meta-publish-prep.js';
import {
  publishFacebook,
  publishInstagram,
  publishThreads,
  publishFacebookReel,
  publishInstagramReel,
  publishThreadsVideo,
  fetchPermalink,
  deletePost,
} from './external/meta-graph-publish.js';
import { getBundle, findPageToken } from './meta-connection.store.js';

export interface ExecResult {
  ok: boolean;
  postId?: string;
  error?: string;
}

/** mkt_publish_records.metadata 에 저장하는 발행 파라미터. */
export interface PublishMeta {
  target_id?: string; // Graph 타겟 id (ig business id / page id / threads id)
  page_name?: string; // 표시용
  content_kind?: 'cardnews' | 'post' | 'reels';
}

// 자동 재시도 정책: 실패 시 백오프 재예약. retry_count 0→1: 15분, 1→2: 1시간, 2→3: 3시간. 소진 시 최종 failed.
const MAX_RETRIES = 3;
const RETRY_BACKOFF_MIN = [15, 60, 180];

function admin(): SupabaseClient | null {
  return getSupabaseAdmin();
}

async function hardFail(sb: SupabaseClient, recordId: string, error: string): Promise<ExecResult> {
  await sb
    .from('mkt_publish_records')
    .update({ status: 'failed', error_message: error, updated_at: new Date().toISOString() })
    .eq('id', recordId);
  return { ok: false, error };
}

// 실패 처리: 미발행 + 재시도 여력 있으면 scheduled 로 백오프 재예약, 아니면 최종 failed.
// - 스케줄러가 scheduled 만 집으므로 '기존 failed' 행은 재시도 안 됨(미래 실패만).
// - 이미 발행됨(published_url/platform_post_id) 이면 재시도 금지 → 중복 발행 방지.
async function fail(sb: SupabaseClient, recordId: string, error: string): Promise<ExecResult> {
  try {
    const { data: row } = await sb
      .from('mkt_publish_records')
      .select('retry_count, published_url, platform_post_id')
      .eq('id', recordId)
      .single();
    const alreadyPosted = !!(row?.published_url || row?.platform_post_id);
    const rc = (row?.retry_count as number | null | undefined) ?? 0;
    if (!alreadyPosted && rc < MAX_RETRIES) {
      const delayMin = RETRY_BACKOFF_MIN[rc] ?? 180;
      const nextAt = new Date(Date.now() + delayMin * 60_000).toISOString();
      const { error: upErr } = await sb
        .from('mkt_publish_records')
        .update({
          status: 'scheduled',
          retry_count: rc + 1,
          scheduled_at: nextAt,
          error_message: `[자동 재시도 ${rc + 1}/${MAX_RETRIES} · ${delayMin}분 후] ${error}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', recordId);
      if (!upErr) return { ok: false, error };
    }
  } catch {
    // 조회/업데이트 예외 → 하드 실패 폴백
  }
  return hardFail(sb, recordId, error);
}

export async function publishRecord(recordId: string): Promise<ExecResult> {
  const sb = admin();
  if (!sb) return { ok: false, error: 'Supabase 서비스 키가 설정되지 않았습니다.' };

  const { data: q } = await sb.from('mkt_publish_records').select('*').eq('id', recordId).single();
  if (!q) return { ok: false, error: '발행 레코드 없음' };

  const platform = q.channel as Platform;
  if (!['facebook', 'instagram', 'threads'].includes(platform)) {
    return fail(sb, recordId, 'Meta 채널이 아닙니다.');
  }

  const meta = (q.metadata ?? {}) as PublishMeta;
  const targetId = meta.target_id;
  if (!targetId) return fail(sb, recordId, '발행 타겟 id 가 없습니다(재예약 필요).');

  const lang = (q.language as string) || 'ko';
  const kind: PublishMeta['content_kind'] = meta.content_kind ?? 'cardnews';

  // ── 콘텐츠 추출 (발행 순간) ──
  const media =
    kind === 'reels'
      ? { ...(await loadReel(sb, q.content_id as string, lang)), imageUrls: [] as string[] }
      : {
          ...(await loadCardnews(sb, q.content_id as string, lang)),
          videoUrl: null as string | null,
          coverUrl: null as string | null,
        };
  const { caption, imageUrls, videoUrl, coverUrl } = media;

  if (kind === 'reels') {
    if (!videoUrl) return fail(sb, recordId, `이 언어(${lang})의 릴스 영상이 없습니다.`);
  } else {
    const v = validatePublish(platform, imageUrls);
    if (!v.ok) return fail(sb, recordId, v.reason || '발행 불가');
  }

  // ── 토큰 해석 ──
  const bundle = await getBundle();
  if (!bundle) return fail(sb, recordId, 'Meta 연결이 없습니다.');
  const token = findPageToken(bundle, targetId);
  if (!token) return fail(sb, recordId, '해당 타겟의 토큰을 찾을 수 없습니다(재연결 필요).');

  try {
    let postId = '';
    if (kind === 'reels') {
      const v = videoUrl as string;
      if (platform === 'facebook') postId = await publishFacebookReel(targetId, token, caption, v);
      else if (platform === 'instagram')
        postId = await publishInstagramReel(targetId, token, caption, v, coverUrl);
      else postId = await publishThreadsVideo(targetId, token, caption, v);
    } else if (platform === 'facebook')
      postId = await publishFacebook(targetId, token, caption, imageUrls);
    else if (platform === 'instagram')
      postId = await publishInstagram(targetId, token, caption, imageUrls);
    else postId = await publishThreads(targetId, token, caption, imageUrls);

    // post 생성 성공 = 발행 성공. permalink 는 부가 — 실패해도 published 처리(재시도→중복 발행 방지).
    let publishedUrl: string | null = null;
    try {
      publishedUrl = await fetchPermalink(platform, postId, token);
    } catch {
      /* permalink 실패 무시 */
    }
    await sb
      .from('mkt_publish_records')
      .update({
        status: 'published',
        platform_post_id: postId,
        published_url: publishedUrl ?? '',
        published_at: new Date().toISOString(),
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', recordId);
    return { ok: true, postId };
  } catch (e) {
    return fail(sb, recordId, e instanceof Error ? e.message : '발행 실패');
  }
}

// 발행된 채널 게시물 삭제(페이스북만). 레코드 행 자체 삭제는 호출자가 별도로 수행.
export async function deleteChannelPost(recordId: string): Promise<ExecResult> {
  const sb = admin();
  if (!sb) return { ok: false, error: 'Supabase 서비스 키가 설정되지 않았습니다.' };
  const { data: q } = await sb.from('mkt_publish_records').select('*').eq('id', recordId).single();
  if (!q) return { ok: false, error: '발행 레코드 없음' };
  const platform = q.channel as Platform;
  if (platform !== 'facebook')
    return { ok: false, error: '채널 게시물 삭제는 페이스북만 지원합니다(IG/Threads는 수동).' };
  const postId = q.platform_post_id as string | null;
  if (!postId) return { ok: false, error: '발행된 게시물 id가 없습니다.' };
  const meta = (q.metadata ?? {}) as PublishMeta;
  const targetId = meta.target_id;
  if (!targetId) return { ok: false, error: '발행 타겟 id 가 없습니다.' };
  const bundle = await getBundle();
  if (!bundle) return { ok: false, error: 'Meta 연결이 없습니다.' };
  const token = findPageToken(bundle, targetId);
  if (!token) return { ok: false, error: '해당 타겟의 토큰을 찾을 수 없습니다(재연결 필요).' };
  try {
    await deletePost(postId, token);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : '게시물 삭제 실패' };
  }
}

/**
 * 카드뉴스 캡션(+이미지)을 콘텐츠에서 로드. tangobook 카드뉴스 = mkt_instagram_cards 의
 * background_image_url(카드당 1장 풀블리드). 캡션 = mkt_instagram_contents.caption + hashtags.
 * (dflo 의 언어별 canvas.images[lang] 와 달리 이미지는 단일 소스 — 텍스트가 이미지에 구워져 ko 기준.)
 */
async function loadCardnews(
  sb: SupabaseClient,
  contentId: string,
  _lang: string
): Promise<{ caption: string; imageUrls: string[] }> {
  const { data: igContents } = await sb
    .from('mkt_instagram_contents')
    .select('id, caption, hashtags, content_type')
    .eq('content_id', contentId);
  const list = (igContents ?? []) as Array<{
    id: string;
    caption: string | null;
    hashtags: string[] | null;
    content_type: string;
  }>;
  // 카드뉴스(=릴스 아님) 우선, 없으면 첫 버전.
  const ig = list.find((c) => c.content_type !== 'reels') ?? list[0];
  if (!ig) return { caption: '', imageUrls: [] };

  const tags = (ig.hashtags ?? []).map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' ');
  const caption = [ig.caption?.trim(), tags].filter(Boolean).join('\n\n');

  const { data: cards } = await sb
    .from('mkt_instagram_cards')
    .select('background_image_url, sort_order')
    .eq('instagram_content_id', ig.id)
    .order('sort_order');
  const imageUrls = ((cards ?? []) as Array<{ background_image_url: string | null }>)
    .map((c) => c.background_image_url)
    .filter((u): u is string => typeof u === 'string' && u.length > 0);

  return { caption, imageUrls };
}

/**
 * 릴스(영상) 로드. tangobook 릴스 = mkt_instagram_contents.video_settings.reels[lang]
 * ({ videoUrl, coverUrl }). 캡션 = 그 콘텐츠의 caption + hashtags (카드뉴스 공용).
 */
async function loadReel(
  sb: SupabaseClient,
  contentId: string,
  lang: string
): Promise<{ caption: string; videoUrl: string | null; coverUrl: string | null }> {
  const { data: igContents } = await sb
    .from('mkt_instagram_contents')
    .select('caption, hashtags, video_settings')
    .eq('content_id', contentId);
  const list = (igContents ?? []) as Array<{
    caption: string | null;
    hashtags: string[] | null;
    video_settings: { reels?: Record<string, { videoUrl?: string; coverUrl?: string }> } | null;
  }>;
  const ig = list.find((c) => c.video_settings?.reels) ?? list[0];
  if (!ig) return { caption: '', videoUrl: null, coverUrl: null };

  const reels = ig.video_settings?.reels ?? {};
  const reel = reels[lang] ?? reels.ko ?? Object.values(reels)[0];

  const tags = (ig.hashtags ?? []).map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' ');
  const caption = [ig.caption?.trim(), tags].filter(Boolean).join('\n\n');

  return { caption, videoUrl: reel?.videoUrl ?? null, coverUrl: reel?.coverUrl ?? null };
}
