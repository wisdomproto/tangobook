/**
 * Monitoring service (pillar B) — port of the ContentFlow
 * `monitoring/search/*` + `monitoring/comment` routes into the Tangobook
 * server-layer.
 *
 * Five feed sources behind one `searchMonitoring` fan-out:
 *  - 지식인 / N블로그 / 구글블로그 — public cheerio scrapes (no credentials).
 *    Each builds a FIXED-host URL itself (only the query string is interpolated,
 *    via `encodeURIComponent`), so there is no user-controlled host (no SSRF).
 *    Fetches use `AbortSignal.timeout(10_000)`. The 3 pure mappers (exported,
 *    unit-tested) take a `cheerio.load(html)` `$` + a `max` cap and apply the
 *    per-source host filter + CF's primary→fallback selector sets.
 *  - youtube — reuses `searchVideos` + `getVideoStats` (config.youtubeApiKey,
 *    server-only). NO `ytInitialData` HTML fallback.
 *  - instagram — resolves the Meta page access token SERVER-SIDE via
 *    `resolveMetaCredentials(projectId)` and uses it ONLY inside the server→Graph
 *    fetch URL (R-1). The token NEVER appears in a `FeedItem`, in any returned
 *    value, or in a log line.
 *
 * `searchMonitoring` never throws: every requested source is wrapped in its own
 * try/catch and a failure yields `[]`. For non-`ko` language the 2 Naver
 * sources are skipped server-side (guard even if the client omits them).
 *
 * `monitoringComment` ports the CF comment prompt VERBATIM (platform map, tone
 * map, "sound like a real person, not a bot" persona, language switch) and calls
 * `generateTextWithGemini`. A missing Gemini key makes the wrapper throw — we do
 * NOT swallow it here (the controller maps it to 502).
 */

import * as cheerio from 'cheerio';
import type { CheerioAPI } from 'cheerio';
import { config } from '../../config/index.js';
import { generateTextWithGemini } from '../../providers/gemini.provider.js';
import { searchVideos, getVideoStats } from './external/youtube-data.js';
import { resolveMetaCredentials } from './analytics.service.js';

export type MonitoringPlatform =
  | 'naver_jisikin'
  | 'naver_blog'
  | 'wordpress'
  | 'youtube'
  | 'instagram';

export interface FeedItem {
  platform: MonitoringPlatform;
  id: string;
  title: string;
  snippet: string;
  author: string;
  url?: string;
  thumbnail?: string;
  publishedAt?: string;
  language: string;
  views?: string;
  engagement?: { likes: number; comments: number };
}

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const FETCH_TIMEOUT_MS = 10_000;

// ── Pure mappers (CF selectors, host-filtered, max-capped) ─────────────────────

/**
 * Map kin.naver.com search HTML → FeedItem[] (지식인).
 * Faithful to CF `monitoring/search/naver/route.ts`: primary row selector set
 * then a `qna/detail` anchor fallback. Keeps only `kin.naver.com` links.
 */
export function mapJisikinResults($: CheerioAPI, max: number): FeedItem[] {
  const items: FeedItem[] = [];

  $('ul.basic1 li, .answer_area li, [class*="question"]').each((i, el) => {
    if (items.length >= max) return false;
    const $el = $(el);
    const titleEl = $el.find('a.title, dt a, a[class*="title"]').first();
    const title = titleEl.text().trim();
    const url = titleEl.attr('href') || '';
    const snippet = $el.find('dd, .txt, [class*="answer"]').first().text().trim();
    const date = $el.find('.date, .time, [class*="date"]').first().text().trim();

    if (title && url && url.includes('kin.naver.com')) {
      items.push({
        platform: 'naver_jisikin',
        id: `naver-kin-${i}-${Date.now()}`,
        title,
        snippet: snippet.substring(0, 200),
        author: '지식인',
        url: url.startsWith('http') ? url : `https://kin.naver.com${url}`,
        publishedAt: date,
        language: 'ko',
      });
    }
    return undefined;
  });

  // Fallback: scan for question-detail anchors directly.
  if (items.length === 0) {
    $('a').each((i, el) => {
      if (items.length >= max) return false;
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim();
      if (href.includes('kin.naver.com/qna/detail') && text.length > 5) {
        items.push({
          platform: 'naver_jisikin',
          id: `naver-kin-${i}-${Date.now()}`,
          title: text.substring(0, 100),
          snippet: '',
          author: '지식인',
          url: href.startsWith('http') ? href : `https://kin.naver.com${href}`,
          language: 'ko',
        });
      }
      return undefined;
    });
  }

  return items;
}

/**
 * Map search.naver.com?where=blog HTML → FeedItem[] (N블로그).
 * Faithful to CF `monitoring/search/naver-blog/route.ts`: primary row selector
 * set then a `blog.naver.com` anchor fallback. Keeps only blog.naver.com / m.blog.
 */
export function mapNaverBlogResults($: CheerioAPI, max: number): FeedItem[] {
  const items: FeedItem[] = [];

  $('li.bx, .api_txt_lines, [class*="blog"] li').each((i, el) => {
    if (items.length >= max) return false;
    const $el = $(el);
    const titleEl = $el
      .find('a.api_txt_lines, a[class*="title"], .title_area a, .total_tit a')
      .first();
    const title = titleEl.text().trim();
    const url = titleEl.attr('href') || '';
    const snippet = $el
      .find('.api_txt_lines.dsc_txt, .total_dsc, .dsc_area, [class*="dsc"]')
      .first()
      .text()
      .trim();
    const author = $el
      .find('.sub_txt, .name, [class*="writer"], [class*="author"]')
      .first()
      .text()
      .trim();
    const date = $el.find('.sub_time, .date, [class*="date"]').first().text().trim();
    const thumbnail = $el.find('img').first().attr('src') || '';

    if (title && url && (url.includes('blog.naver.com') || url.includes('m.blog'))) {
      items.push({
        platform: 'naver_blog',
        id: `nblog-${i}-${Date.now()}`,
        title: title.substring(0, 100),
        snippet: snippet.substring(0, 200),
        author: author || '블로거',
        url,
        thumbnail: thumbnail.startsWith('http') ? thumbnail : undefined,
        publishedAt: date,
        language: 'ko',
      });
    }
    return undefined;
  });

  // Fallback: scan for blog.naver.com anchors directly.
  if (items.length === 0) {
    $('a[href*="blog.naver.com"]').each((i, el) => {
      if (items.length >= max) return false;
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim();
      if (text.length > 5 && href.includes('blog.naver.com')) {
        items.push({
          platform: 'naver_blog',
          id: `nblog-${i}-${Date.now()}`,
          title: text.substring(0, 100),
          snippet: '',
          author: '블로거',
          url: href,
          language: 'ko',
        });
      }
      return undefined;
    });
  }

  return items;
}

/**
 * Map google.com/search HTML → FeedItem[] (구글블로그, platform 'wordpress').
 * Faithful to CF `monitoring/search/google-blog/route.ts`. Excludes google.com
 * self-links; author falls back to the URL hostname when no <cite> is present.
 */
export function mapGoogleBlogResults($: CheerioAPI, max: number, lang: string): FeedItem[] {
  const items: FeedItem[] = [];

  $('div.g, div[data-sokoban-container]').each((i, el) => {
    if (items.length >= max) return false;
    const $el = $(el);
    const title = $el.find('h3').first().text().trim();
    const url = $el.find('a[href^="http"]').first().attr('href') || '';
    const snippet = $el
      .find('[data-sncf], .VwiC3b, [style*="-webkit-line-clamp"]')
      .first()
      .text()
      .trim();
    const siteName = $el.find('cite, .NJjxre').first().text().trim();

    if (title && url && !url.includes('google.com')) {
      let hostname: string;
      try {
        hostname = new URL(url).hostname;
      } catch {
        hostname = '';
      }
      items.push({
        platform: 'wordpress',
        id: `gblog-${i}-${Date.now()}`,
        title: title.substring(0, 100),
        snippet: snippet.substring(0, 200),
        author: siteName || hostname,
        url,
        publishedAt: '',
        language: lang,
      });
    }
    return undefined;
  });

  return items;
}

/**
 * Format a YouTube view count using Korean units — EXACT CF
 * `monitoring/search/youtube/route.ts` thresholds:
 *  <1000 → raw, <10000 → comma-grouped, <1e8 → 만 (1 dp), else 억 (1 dp).
 */
export function formatViews(n: number): string {
  if (n < 1000) return String(n);
  if (n < 10000) return n.toLocaleString();
  if (n < 100000000) return `${(n / 10000).toFixed(1)}만`;
  return `${(n / 100000000).toFixed(1)}억`;
}

// ── Fixed-host fetch helpers (no user host → no SSRF) ──────────────────────────

async function fetchHtml(url: string, lang: string): Promise<CheerioAPI> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      'Accept-Language': lang === 'ko' ? 'ko-KR,ko;q=0.9' : 'en-US,en;q=0.9',
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  const html = await res.text();
  return cheerio.load(html);
}

async function fetchJisikin(keyword: string, max: number): Promise<FeedItem[]> {
  const url = `https://kin.naver.com/search/list.naver?query=${encodeURIComponent(
    keyword
  )}&sort=date`;
  return mapJisikinResults(await fetchHtml(url, 'ko'), max);
}

async function fetchNaverBlog(keyword: string, max: number): Promise<FeedItem[]> {
  const url = `https://search.naver.com/search.naver?where=blog&query=${encodeURIComponent(
    keyword
  )}&sm=tab_opt&sort=sim`;
  return mapNaverBlogResults(await fetchHtml(url, 'ko'), max);
}

async function fetchGoogleBlog(keyword: string, lang: string, max: number): Promise<FeedItem[]> {
  const url = `https://www.google.com/search?q=${encodeURIComponent(
    `${keyword} blog`
  )}&hl=${encodeURIComponent(lang)}&num=${max}`;
  return mapGoogleBlogResults(await fetchHtml(url, lang), max, lang);
}

// ── YouTube source (reuses youtube-data wrappers; no HTML fallback) ────────────

async function fetchYoutube(keyword: string, lang: string, max: number): Promise<FeedItem[]> {
  const videos = await searchVideos(keyword, {
    relevanceLanguage: lang,
    order: 'relevance',
    maxResults: max,
  });
  const ids = videos.map((v) => v.videoId);
  const stats = await getVideoStats(ids);
  const statById = new Map(stats.map((s) => [s.videoId, s]));

  return videos.map((v) => {
    const stat = statById.get(v.videoId);
    const item: FeedItem = {
      platform: 'youtube',
      id: v.videoId,
      title: v.title,
      snippet: v.description,
      author: v.channelTitle,
      url: `https://www.youtube.com/watch?v=${v.videoId}`,
      thumbnail: v.thumbnailUrl || undefined,
      publishedAt: v.publishedAt || undefined,
      language: lang,
    };
    if (stat) {
      item.views = formatViews(stat.viewCount);
      item.engagement = { likes: stat.likeCount, comments: stat.commentCount };
    }
    return item;
  });
}

// ── Instagram source (Meta token resolved + used SERVER-SIDE only) ─────────────

interface IgHashtagSearchResponse {
  data?: Array<{ id?: string }>;
  error?: { message?: string };
}
interface IgRecentMediaResponse {
  data?: Array<{
    id?: string;
    caption?: string;
    permalink?: string;
    media_url?: string;
    timestamp?: string;
    like_count?: number;
    comments_count?: number;
  }>;
}

async function fetchInstagram(
  projectId: string,
  keyword: string,
  max: number
): Promise<FeedItem[]> {
  // R-1: token is resolved server-side and used ONLY in the Graph URLs below.
  const { pages } = await resolveMetaCredentials(projectId);
  const page = pages[0];
  const igUserId = page?.instagram?.id;
  if (!page || !igUserId) return [];
  const accessToken = page.pageAccessToken;

  const hashtagRes = await fetch(
    `https://graph.facebook.com/v21.0/ig_hashtag_search?q=${encodeURIComponent(
      keyword
    )}&user_id=${encodeURIComponent(igUserId)}&access_token=${accessToken}`,
    { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }
  );
  const hashtagData = (await hashtagRes.json()) as IgHashtagSearchResponse;
  const hashtagId = hashtagData.data?.[0]?.id;
  if (!hashtagId) return [];

  const mediaRes = await fetch(
    `https://graph.facebook.com/v21.0/${encodeURIComponent(
      hashtagId
    )}/recent_media?user_id=${encodeURIComponent(
      igUserId
    )}&fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count&access_token=${accessToken}`,
    { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }
  );
  const mediaData = (await mediaRes.json()) as IgRecentMediaResponse;

  return (mediaData.data || []).slice(0, max).map((post) => ({
    platform: 'instagram' as const,
    id: post.id ?? '',
    title: (post.caption || '').substring(0, 100),
    snippet: post.caption || '',
    author: '',
    url: post.permalink,
    thumbnail: post.media_url,
    publishedAt: post.timestamp,
    language: 'auto',
    engagement: { likes: post.like_count || 0, comments: post.comments_count || 0 },
  }));
  // NOTE: `accessToken` is intentionally absent from every FeedItem above.
}

// ── Fan-out ────────────────────────────────────────────────────────────────────

export const ALL_MONITORING_SOURCES: MonitoringPlatform[] = [
  'naver_jisikin',
  'naver_blog',
  'wordpress',
  'youtube',
  'instagram',
];

export interface SearchMonitoringParams {
  projectId: string;
  keyword: string;
  language?: string;
  sources?: MonitoringPlatform[];
  maxResults?: number;
}

/**
 * Fan out across the requested sources (default all). Each source runs in its
 * own try/catch so one failure yields `[]` and never aborts the others — the
 * function never throws. Non-`ko` language skips the 2 Naver sources.
 */
export async function searchMonitoring(
  params: SearchMonitoringParams
): Promise<{ items: FeedItem[] }> {
  const { projectId, keyword } = params;
  const language = params.language || 'ko';
  const max = params.maxResults ?? 10;
  const requested = params.sources?.length ? params.sources : ALL_MONITORING_SOURCES;

  // Naver sources are Korean-only — guard server-side even if the client omits.
  const sources = requested.filter((s) =>
    language === 'ko' ? true : s !== 'naver_jisikin' && s !== 'naver_blog'
  );

  const runSource = async (source: MonitoringPlatform): Promise<FeedItem[]> => {
    try {
      switch (source) {
        case 'naver_jisikin':
          return await fetchJisikin(keyword, max);
        case 'naver_blog':
          return await fetchNaverBlog(keyword, max);
        case 'wordpress':
          return await fetchGoogleBlog(keyword, language, max);
        case 'youtube':
          return await fetchYoutube(keyword, language, max);
        case 'instagram':
          return await fetchInstagram(projectId, keyword, max);
        default:
          return [];
      }
    } catch {
      // A failing source (no key, scrape shape change, network) → empty, never throw.
      return [];
    }
  };

  const settled = await Promise.allSettled(sources.map(runSource));
  const items = settled.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
  return { items };
}

// ── Comment generation (CF prompt VERBATIM) ────────────────────────────────────

export interface MonitoringCommentParams {
  contentText: string;
  platform: string;
  tone: string;
  language?: string;
  projectContext?: string;
}

const TONE_MAP: Record<string, string> = {
  professional: 'Write as a knowledgeable professional. Provide value and insight.',
  friendly: 'Write in a warm, approachable tone. Use casual language and emojis sparingly.',
  short: 'Write very concisely in 1-2 sentences. Get to the point.',
};

const PLATFORM_MAP: Record<string, string> = {
  instagram: 'Instagram comment — keep it brief and engaging',
  youtube: 'YouTube comment — add value to the discussion',
  naver_jisikin: 'Naver 지식인 answer — provide helpful, detailed information',
  naver_blog: 'Blog comment — show genuine interest and engagement',
};

/**
 * Generate a natural comment/reply via Gemini. The prompt is a VERBATIM port of
 * CF `monitoring/comment/route.ts`. A missing Gemini key makes the wrapper
 * throw — propagated (the controller maps it to 502).
 */
export async function monitoringComment(
  params: MonitoringCommentParams
): Promise<{ comment: string }> {
  const { contentText, platform, tone, projectContext } = params;
  const language = params.language || 'ko';

  const prompt = `Generate a natural, authentic comment/reply for this content.
Platform: ${PLATFORM_MAP[platform] || platform}
Tone: ${TONE_MAP[tone] || tone}
Language: ${language}
${projectContext ? `Your context: ${projectContext}` : ''}

Rules:
- Sound like a real person, not a bot
- Add value (share insight, ask a question, or relate with experience)
- Do NOT be promotional or salesy
- Keep it natural for the platform
- Write in ${
    language === 'ko'
      ? 'Korean'
      : language === 'en'
        ? 'English'
        : language === 'th'
          ? 'Thai'
          : 'Vietnamese'
  }

Content to comment on:
${contentText.substring(0, 1000)}

Generate ONLY the comment text, no explanation.`;

  const text = await generateTextWithGemini(prompt, 3, config.gemini.textModel);
  return { comment: text.trim() };
}
