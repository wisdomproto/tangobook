/**
 * 콘텐츠 파이프라인 감사 서비스 — I/O 조립 + 캐시.
 * R2(책 풀 JSON) + Supabase(마케팅 자산·발행) + R2 쇼츠 업로드 상태를 모아
 * derive.ts 순수 함수로 rows/todos 를 산출한다.
 *
 * 캐시 정책: 무거운 감사(R2 풀 스캔 + Supabase 조회)만 5분 캐시.
 * 승인(loadApprovals)은 매 요청 fresh(1콜)로 merge — editor2 토글 즉시 반영 요구.
 */
import axios from 'axios';
import type { Storybook } from '@tangobook/shared';
import { R2Repository } from '../../repositories/r2.repository.js';
import { r2PublicUrl } from '../../providers/r2.provider.js';
import { getSupabaseAdmin } from '../../providers/supabase-admin.provider.js';
import { loadApprovals } from './approval-store.js';
import {
  deriveAuthoring,
  deriveMarketing,
  deriveTodos,
  filterPipelineTargets,
  type MarketingSources,
  type PipelineRow,
  type Todo,
} from './derive.js';

const CACHE_TTL = 5 * 60_000; // 무거운 감사만 캐시. 승인은 매 요청 fresh(1콜) merge — editor2 토글 즉시 반영 요구.
const POOL_SIZE = 8;
const SHORTS_STATE_KEY = '_index/shorts-upload-state.json';
/** 릴스 videoUrl 에서 bookId 추출 (build-shorts-catalog.mjs 와 동일 패턴) */
const REEL_URL_RE = /\/reels\/(\d+)-\d+\.mp4/;

export interface PipelineResult {
  rows: PipelineRow[];
  todos: Todo[];
  generatedAt: string;
}

type CachedRow = Omit<PipelineRow, 'approved'>;

let cache: { rows: CachedRow[]; at: number } | null = null;
let inFlight: Promise<CachedRow[]> | null = null;

/** 동시 N개 제한 매퍼 (기존 공용 유틸 없음 — 로컬 구현) */
async function mapPool<T, R>(items: T[], size: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return out;
}

/** supabase 1000행 기본 limit 대응 — 페이지네이션 전체 조회 */
async function selectAll<T>(
  query: (
    from: number,
    to: number
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  label: string
): Promise<T[]> {
  const PAGE = 1000;
  const all: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await query(from, from + PAGE - 1);
    if (error) throw new Error(`${label} 조회 실패: ${error.message}`);
    const rows = data ?? [];
    all.push(...rows);
    if (rows.length < PAGE) break;
  }
  return all;
}

function emptySources(): MarketingSources {
  return {
    reelsByBook: {},
    longformByBook: {},
    blogBookIds: new Set(),
    cardnewsBookIds: new Set(),
    shortsUploaded: {},
    publishByBook: {},
  };
}

async function loadShortsUploaded(): Promise<Record<string, { videoId: string }>> {
  try {
    const res = await axios.get<{ uploaded?: Record<string, { videoId: string }> }>(
      `${r2PublicUrl}/${SHORTS_STATE_KEY}`,
      { timeout: 5000, params: { t: Date.now() } }
    );
    return res.data?.uploaded ?? {};
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) return {}; // 아직 R2 이동 전/미존재
    console.warn('[content-pipeline] shorts-upload-state 로드 실패:', (err as Error).message);
    return {};
  }
}

export async function loadMarketingSources(): Promise<MarketingSources> {
  const src = emptySources();
  src.shortsUploaded = await loadShortsUploaded();

  const sb = getSupabaseAdmin();
  if (!sb) {
    // Supabase 미설정(로컬 등) — 마케팅 자산은 전부 미보유로 표시하고 저작 감사만 제공.
    console.warn('[content-pipeline] Supabase admin 미설정 — 마케팅 소스 생략');
    return src;
  }

  // bookId 매핑의 근간: mkt_contents.memo = 'storybook:<bookId>' (register/seed 스크립트 규약)
  const contents = await selectAll<{ id: string; memo: string | null }>(
    (from, to) =>
      sb.from('mkt_contents').select('id, memo').like('memo', 'storybook:%').range(from, to),
    'mkt_contents'
  );
  const bookIdByContentId = new Map<string, string>();
  for (const c of contents) {
    const bookId = c.memo?.slice('storybook:'.length);
    if (bookId) bookIdByContentId.set(c.id, bookId);
  }

  // 릴스: mkt_instagram_contents.video_settings.reels[lang].videoUrl → URL 패턴에서 bookId
  const igRows = await selectAll<{
    id: string;
    content_id: string;
    video_settings: Record<string, any> | null;
  }>(
    (from, to) =>
      sb.from('mkt_instagram_contents').select('id, content_id, video_settings').range(from, to),
    'mkt_instagram_contents'
  );
  const contentIdByIgId = new Map<string, string>();
  for (const row of igRows) {
    contentIdByIgId.set(row.id, row.content_id);
    const reels = (row.video_settings?.reels ?? {}) as Record<string, { videoUrl?: string }>;
    for (const [lang, entry] of Object.entries(reels)) {
      const url = entry?.videoUrl;
      if (!url) continue;
      // URL 패턴 우선(레거시 규약), 실패 시 content memo 매핑 폴백
      const bookId = url.match(REEL_URL_RE)?.[1] ?? bookIdByContentId.get(row.content_id);
      if (!bookId) continue;
      (src.reelsByBook[bookId] ??= {})[lang] = true;
    }
  }

  // 롱폼: mkt_youtube_contents.video_settings = { bookId, artStyle, language, ... } (실측 — longform-publish 저장 형태)
  const ytRows = await selectAll<{
    video_url: string | null;
    video_settings: Record<string, any> | null;
  }>(
    (from, to) =>
      sb.from('mkt_youtube_contents').select('video_url, video_settings').range(from, to),
    'mkt_youtube_contents'
  );
  for (const row of ytRows) {
    const vs = row.video_settings ?? {};
    const { bookId, artStyle, language } = vs as {
      bookId?: string;
      artStyle?: string;
      language?: string;
    };
    if (!row.video_url || !bookId || !artStyle || !language) continue;
    const byLang = (src.longformByBook[bookId] ??= {});
    const styles = (byLang[language] ??= []);
    if (!styles.includes(artStyle)) styles.push(artStyle);
  }

  // 블로그: mkt_blog_contents.content_id → memo 매핑 (seed-marketing-blogs 규약 — 신뢰 가능)
  const blogRows = await selectAll<{ content_id: string }>(
    (from, to) => sb.from('mkt_blog_contents').select('content_id').range(from, to),
    'mkt_blog_contents'
  );
  for (const row of blogRows) {
    const bookId = bookIdByContentId.get(row.content_id);
    if (bookId) src.blogBookIds.add(bookId);
  }

  // 카드뉴스: mkt_instagram_cards.instagram_content_id → ig 행 → content_id → memo 매핑
  const cardRows = await selectAll<{ instagram_content_id: string }>(
    (from, to) => sb.from('mkt_instagram_cards').select('instagram_content_id').range(from, to),
    'mkt_instagram_cards'
  );
  for (const row of cardRows) {
    const contentId = contentIdByIgId.get(row.instagram_content_id);
    const bookId = contentId ? bookIdByContentId.get(contentId) : undefined;
    if (bookId) src.cardnewsBookIds.add(bookId);
  }

  // 발행 기록: mkt_publish_records.content_id → memo 매핑.
  // channel 정규화: youtube + metadata.content_kind='longform' → 'youtube-longform' (schedule-longform-youtube 규약).
  const pubRows = await selectAll<{
    content_id: string;
    channel: string;
    status: string;
    metadata: Record<string, any> | null;
  }>(
    (from, to) =>
      sb
        .from('mkt_publish_records')
        .select('content_id, channel, status, metadata')
        .range(from, to),
    'mkt_publish_records'
  );
  for (const row of pubRows) {
    const bookId = bookIdByContentId.get(row.content_id);
    if (!bookId) continue;
    const channel =
      row.channel === 'youtube' && row.metadata?.content_kind === 'longform'
        ? 'youtube-longform'
        : row.channel;
    (src.publishByBook[bookId] ??= []).push({ channel, status: row.status });
  }

  return src;
}

async function buildRows(): Promise<CachedRow[]> {
  const summaries = await R2Repository.listStorybooks();
  const targets = filterPipelineTargets(summaries);
  const [books, sources] = await Promise.all([
    mapPool(targets, POOL_SIZE, (s) => R2Repository.getStorybook(s.id)),
    loadMarketingSources(),
  ]);

  const rows: CachedRow[] = [];
  for (const book of books) {
    if (!book) continue; // 개별 로드 실패 무시 (listStorybooks 와 동일 정책)
    const sb = book as Storybook;
    const authoring = deriveAuthoring(sb);
    rows.push({
      bookId: String(sb.id),
      title: sb.title ?? '',
      series: authoring.series,
      authoring,
      marketing: deriveMarketing(String(sb.id), sources),
      category: sb.category,
    });
  }
  return rows;
}

export async function getPipeline(refresh = false): Promise<PipelineResult> {
  const stale = !cache || Date.now() - cache.at > CACHE_TTL;
  if (refresh || stale) {
    if (!inFlight) {
      inFlight = buildRows().finally(() => {
        inFlight = null;
      });
    }
    const rows = await inFlight;
    cache = { rows, at: Date.now() };
  }

  // 승인은 매 요청 fresh — editor2 토글이 즉시 반영돼야 함 (R2 1콜).
  const approvals = await loadApprovals();
  const rows: PipelineRow[] = cache!.rows.map((r) => ({
    ...r,
    approved: !!approvals[r.bookId],
  }));
  return { rows, todos: deriveTodos(rows), generatedAt: new Date(cache!.at).toISOString() };
}
