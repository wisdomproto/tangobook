// 발행 레코드 1건을 실제 Meta(IG/FB/Threads) 로 발행하는 공용 실행기. 수동(/publish/run)·자동(scheduler) 공용.
// dflo(ai-server/services/publishExecutor.ts)에서 이식 — tangobook 스키마(mkt_publish_records +
// mkt_instagram_contents/cards)에 맞춰 적응. self_hosted(website)는 기존 스케줄러가 담당하므로 여기선
// meta 채널만 처리한다. 타겟 id/콘텐츠 종류는 레코드 metadata 에 담겨 온다(별도 채널 테이블 없음).
import { Readable } from 'node:stream';
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
import { YouTubeProvider } from '../../providers/youtube.provider.js';
import { matchYoutubeRow } from '../reel/longform-publish.js';

export interface ExecResult {
  ok: boolean;
  postId?: string;
  error?: string;
}

/** mkt_publish_records.metadata 에 저장하는 발행 파라미터. */
export interface PublishMeta {
  target_id?: string; // Graph 타겟 id (ig business id / page id / threads id) / YouTube 내부 채널 id
  page_name?: string; // 표시용
  content_kind?: 'cardnews' | 'post' | 'reels' | 'longform';
  art_style?: string; // 롱폼: mkt_youtube_contents 에서 (artStyle,language) 행 선택용
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

  // YouTube 는 Meta 번들/토큰이 아니라 기존 youtube.provider(오디오북·롱폼 공용) 로 업로드.
  if (q.channel === 'youtube') return publishYouTube(sb, q, recordId);

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

/** "01. 골고루 먹으면 무지개 힘!" → "골고루 먹으면 무지개 힘!"
 *  선두 번호는 호리네 생활동화 회차 정렬용 내부 표기라 외부 발행물에 나가면 안 된다. */
export function stripLeadingNumber(title: string): string {
  return title.replace(/^\s*\d+\.\s*/, '').trim() || title;
}

/**
 * fetch 응답 본문을 Node 스트림으로 — 영상을 메모리에 통째로 올리지 않기 위해서다.
 * 🔴 컴필레이션(트랙 묶음)은 편당 ~190MB × 8편 = 2GB 라 arrayBuffer() 로 받으면
 * Railway 스케줄러가 OOM 난다. 스트림이면 메모리가 파일 크기와 무관해진다.
 * bytes = Content-Length(진행률 계산용). 헤더가 없으면 undefined — 업로드는 정상, 진행률만 생략.
 */
function streamFromResponse(res: Response): { body: Readable; bytes?: number } {
  const len = Number(res.headers.get('content-length'));
  return {
    body: Readable.fromWeb(res.body as Parameters<typeof Readable.fromWeb>[0]),
    bytes: Number.isFinite(len) && len > 0 ? len : undefined,
  };
}

/**
 * 롱폼 제목 → 쇼츠 제목.
 * 롱폼 제목은 `소재 이모지 | 훅·검색키워드 | 시리즈 오디오북` 3단 구조인데, 마지막 시리즈 구간
 * ("… 오디오북")은 36초 쇼츠에 안 맞는다. 그렇다고 제목을 통째로 버리면 가운데 **검색 키워드**
 * ("양치 안 하는 아이를 위한 동화")까지 잃는다 → 접미사만 떼고 `#Shorts` 를 붙인다.
 *
 *   "치카치카 쓱쓱! 🪥✨ | 양치 안 하는 아이를 위한 동화 | 호리네 생활동화 오디오북"
 *   → "치카치카 쓱쓱! 🪥✨ | 양치 안 하는 아이를 위한 동화 #Shorts"
 */
export function deriveShortsTitle(longformTitle: string): string {
  const segs = stripLeadingNumber(longformTitle)
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);
  if (!segs.length) return longformTitle;
  // 마지막 구간이 시리즈 접미사면 뗀다 — 단, 떼고도 최소 1구간은 남아야 한다.
  if (segs.length > 1 && /오디오북/.test(segs[segs.length - 1])) segs.pop();
  let base = segs.join(' | ');
  if (/#Shorts/i.test(base)) return base.slice(0, 100);
  // "#Shorts"(8자) 자리를 남기고 자른다.
  if (base.length > 92)
    base = base
      .slice(0, 92)
      .replace(/\s+\S*$/, '')
      .trim();
  return `${base} #Shorts`;
}

/** 같은 책의 롱폼 메타(제목·줄거리·태그) — 쇼츠 제목/설명/태그 재사용용. 행이 없으면 null.
 *  🔴 `video_settings` 는 5개 언어 자막 전문이 든 수 MB짜리라 select 하지 않는다 —
 *  언어 매칭은 JSON 연산자로 DB 쪽에서 거른다. */
async function loadYoutubeMetaForShorts(
  sb: SupabaseClient,
  contentId: string,
  lang: string
): Promise<{ title: string; description: string; tags: string[] } | null> {
  type Row = {
    video_title?: string | null;
    video_description?: string | null;
    video_tags?: string[] | null;
  };
  const pick = (rows: Row[] | null) => {
    const r = (rows ?? [])[0];
    if (!r) return null;
    return {
      title: r.video_title ?? '',
      description: r.video_description ?? '',
      tags: Array.isArray(r.video_tags) ? r.video_tags : [],
    };
  };
  const COLS = 'video_title, video_description, video_tags';
  const { data } = await sb
    .from('mkt_youtube_contents')
    .select(COLS)
    .eq('content_id', contentId)
    .eq('video_settings->>language', lang)
    .limit(1);
  // 그 언어 롱폼이 아직 없으면(렌더 전) 아무 행이나 — 태그는 언어 무관하게 쓸 만하다.
  if (pick(data as Row[])) return pick(data as Row[]);
  const { data: any0 } = await sb
    .from('mkt_youtube_contents')
    .select(COLS)
    .eq('content_id', contentId)
    .limit(1);
  return pick(any0 as Row[]);
}

/**
 * YouTube(쇼츠) 발행. 릴스 mp4 를 R2에서 받아 기존 youtube.provider 로 업로드.
 * target_id(metadata) = 내부 유튜브 채널 id(선택, 없으면 첫 채널). 제목=콘텐츠 제목(선두 번호 제거),
 * 설명·태그=릴스 캡션 우선, 없으면 같은 책의 롱폼 메타 재사용.
 */
async function publishYouTube(
  sb: SupabaseClient,
  q: Record<string, unknown>,
  recordId: string
): Promise<ExecResult> {
  const lang = (q.language as string) || 'ko';
  const meta = (q.metadata ?? {}) as PublishMeta & {
    title?: string;
    privacy?: 'public' | 'unlisted' | 'private';
  };

  // 롱폼(오디오북) 발행 — 쇼츠와 달리 mkt_youtube_contents 에서 (artStyle,language) 행을 로드.
  if (meta.content_kind === 'longform') return publishLongformYouTube(sb, q, recordId, lang, meta);

  const reel = await loadReel(sb, q.content_id as string, lang);
  if (!reel.videoUrl) return fail(sb, recordId, '유튜브에 올릴 릴스 영상이 없습니다.');

  const { data: c } = await sb
    .from('mkt_contents')
    .select('title')
    .eq('id', q.content_id as string)
    .single();
  // 릴스 캡션·해시태그가 비어 있는 시리즈(생활동화)는 설명이 "#Shorts #탱고북 #동화" 뿐이라
  // 검색에 안 걸린다 → 같은 책의 롱폼 메타(제목·줄거리·태그)를 재사용한다.
  const yt = await loadYoutubeMetaForShorts(sb, q.content_id as string, lang);
  // 🔴 제목 = 롱폼 메타에서 시리즈 접미사만 뗀 것 > 레코드/콘텐츠 원본.
  // 원본(meta.title = mkt_contents.title 복사본)은 검색 키워드가 없다("치카치카 쓱쓱, 반짝반짝!").
  // 롱폼 제목을 통째로 버리면 가운데 키워드("양치 안 하는 아이를 위한 동화")까지 잃으므로
  // deriveShortsTitle 로 "… 오디오북" 접미사만 떼서 쓴다.
  const title = yt?.title
    ? deriveShortsTitle(yt.title)
    : stripLeadingNumber(meta.title || (c?.title as string) || '탱고북 동화').slice(0, 100);
  const body = reel.caption?.trim() || yt?.description?.trim();
  const description = [body, '#Shorts #탱고북 #동화'].filter(Boolean).join('\n\n');
  const tags = yt?.tags?.length
    ? [...yt.tags.slice(0, 12), 'shorts']
    : ['탱고북', '동화', 'shorts'];

  try {
    const res = await fetch(encodeURI(reel.videoUrl));
    if (!res.ok || !res.body) return fail(sb, recordId, `영상 다운로드 실패 (${res.status})`);
    const { body: videoStream, bytes: videoBytes } = streamFromResponse(res);
    const up = await YouTubeProvider.uploadVideo(
      videoStream,
      {
        title,
        description,
        privacy: meta.privacy || 'public',
        categoryId: '22',
        tags,
        language: lang,
      },
      undefined,
      meta.target_id || undefined,
      videoBytes
    );

    // 썸네일(릴스 표지) — best-effort. 🔴 쇼츠 **피드**는 유튜브가 영상 프레임을 쓰므로 여기서
    // 올린 썸네일이 안 보인다. 그래도 채널 페이지 Shorts 선반·검색·구독 피드에는 반영되므로
    // 올려 둔다(예전엔 아예 안 올려서 그 자리에도 잘린 중간 프레임이 나왔다).
    if (reel.coverUrl) {
      try {
        const tRes = await fetch(encodeURI(reel.coverUrl));
        if (tRes.ok) {
          const tBuf = Buffer.from(await tRes.arrayBuffer());
          await YouTubeProvider.setThumbnail(up.videoId, tBuf, meta.target_id || undefined);
        }
      } catch (e) {
        console.warn('[shorts-yt] 썸네일 세팅 실패(무시):', (e as Error).message);
      }
    }

    const now = new Date().toISOString();
    await sb
      .from('mkt_publish_records')
      .update({
        status: 'published',
        platform_post_id: up.videoId,
        published_url: up.videoUrl,
        published_at: now,
        error_message: null,
        updated_at: now,
      })
      .eq('id', recordId);
    return { ok: true, postId: up.videoId };
  } catch (e) {
    return fail(sb, recordId, e instanceof Error ? e.message : 'YouTube 발행 실패');
  }
}

/**
 * 롱폼(오디오북) 유튜브 발행. mkt_youtube_contents 의 (artStyle,language) 행에서 롱폼 영상·메타를 읽어
 * 기존 youtube.provider 로 업로드한다. 쇼츠와 달리 #Shorts 없이 categoryId 27(교육) + 롱폼 태그.
 * 썸네일 = 언어별 표지(thumbnail_url) — best-effort(맞춤 썸네일은 채널 인증 필요, 실패해도 발행은 성공).
 */
async function publishLongformYouTube(
  sb: SupabaseClient,
  q: Record<string, unknown>,
  recordId: string,
  lang: string,
  meta: PublishMeta & { title?: string; privacy?: 'public' | 'unlisted' | 'private' }
): Promise<ExecResult> {
  const artStyle = meta.art_style;
  if (!artStyle) return fail(sb, recordId, '롱폼 발행에 art_style(그림체)이 없습니다.');

  const { data: rows } = await sb
    .from('mkt_youtube_contents')
    .select(
      'id, video_settings, video_url, thumbnail_url, video_title, video_description, video_tags'
    )
    .eq('content_id', q.content_id as string);
  const row = matchYoutubeRow((rows ?? []) as any[], artStyle, lang) as {
    video_url?: string | null;
    thumbnail_url?: string | null;
    video_title?: string | null;
    video_description?: string | null;
    video_tags?: string[] | null;
  } | null;

  if (!row?.video_url)
    return fail(sb, recordId, `발행할 롱폼 영상이 없습니다 (${artStyle}/${lang}).`);

  // 🔴 제목 우선순위 = 공들여 만든 롱폼 메타(video_title) > 예약 레코드의 원본 제목(meta.title).
  // 레코드의 metadata.title 은 발행큐 표시용으로 mkt_contents.title 을 그대로 복사한 값이라
  // 검색 키워드가 없다("01. 골고루 먹으면 무지개 힘!", "게", "고래"). 이 원본이 video_title
  // ("… | 편식하는 아이를 위한 동화 | …")을 가려서 조회수가 0~4회에 머물렀다.
  // 선두 번호 제거는 video_title 이 없는 폴백 경로를 위해 유지한다.
  const title = stripLeadingNumber(row.video_title || meta.title || '탱고북 동화').slice(0, 100);
  const description = row.video_description || '';
  const tags = Array.isArray(row.video_tags) ? row.video_tags : ['탱고북', '동화', '오디오북'];

  try {
    const res = await fetch(encodeURI(row.video_url));
    if (!res.ok || !res.body) return fail(sb, recordId, `영상 다운로드 실패 (${res.status})`);
    // 🔴 R2 → YouTube 를 스트림으로 흘린다(버퍼 X). 컴필레이션 묶음은 2GB 를 넘어서
    // arrayBuffer() 로 받으면 Railway 스케줄러가 OOM 난다.
    const { body: videoStream, bytes: videoBytes } = streamFromResponse(res);
    const up = await YouTubeProvider.uploadVideo(
      videoStream,
      {
        title,
        description,
        privacy: meta.privacy || 'public',
        categoryId: '27', // Education
        tags,
        language: lang,
      },
      undefined,
      meta.target_id || undefined,
      videoBytes
    );

    // 썸네일(언어별 표지) 세팅 — best-effort. 맞춤 썸네일은 인증 채널만 허용되므로 실패해도 무시.
    if (row.thumbnail_url) {
      try {
        const tRes = await fetch(encodeURI(row.thumbnail_url));
        if (tRes.ok) {
          const tBuf = Buffer.from(await tRes.arrayBuffer());
          await YouTubeProvider.setThumbnail(up.videoId, tBuf, meta.target_id || undefined);
        }
      } catch (e) {
        console.warn('[longform-yt] 썸네일 세팅 실패(무시):', (e as Error).message);
      }
    }

    const now = new Date().toISOString();
    await sb
      .from('mkt_publish_records')
      .update({
        status: 'published',
        platform_post_id: up.videoId,
        published_url: up.videoUrl,
        published_at: now,
        error_message: null,
        updated_at: now,
      })
      .eq('id', recordId);
    return { ok: true, postId: up.videoId };
  } catch (e) {
    return fail(sb, recordId, e instanceof Error ? e.message : 'YouTube 롱폼 발행 실패');
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
