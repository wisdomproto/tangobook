/**
 * GA4 analytics service (server-proxy; per-project creds read server-side).
 *
 * - `resolveGa4Config(projectId)` reads the project's `ga4_config` from
 *   `mkt_projects` via the service-role admin client, with a `config.ga4` env
 *   fallback. The private key is un-escaped (literal `\n` → real newlines) and
 *   **NEVER leaves the server** — the client sends only `{ projectId, period }`,
 *   and no endpoint echoes the resolved config back (R-1 / R-6). When neither
 *   the row nor env has propertyId+clientEmail+privateKey it throws
 *   `AppError(501, …)` so the client renders the "연결 필요" empty state.
 * - 6 pure row→viewmodel mappers (the primary TDD unit) faithful to the CF
 *   analytics routes' response shapes.
 * - 5 report builders that build the GA4 `runReport` body per the spec §4.2
 *   table and map the rows. The controller resolves `cfg` once per request and
 *   passes it to the builder (so we don't re-read the project row per report).
 */

import { getSupabaseAdmin } from '../../providers/supabase-admin.provider.js';
import { config } from '../../config/index.js';
import { AppError } from '../../middleware/error.middleware.js';
import { runReport, type GA4Report } from './external/ga4.js';
import { getPageMediaInsights, type MetaPage } from './external/meta-graph.js';
import {
  searchChannels,
  getChannelInfo,
  getChannelVideos,
  getVideoStats,
} from './external/youtube-data.js';

// Server-side view-model shapes — plain JSON returned to the client. These mirror
// the client `features/marketing/types/analytics.ts` interfaces exactly (the
// client types match this payload). Defined here because those client types
// don't live in @tangobook/shared.
export interface GA4OverviewData {
  period: string;
  totalSessions: number;
  totalUsers: number;
  totalPageviews: number;
  bounceRate: number;
  avgSessionDuration: number;
  dailyPageviews: { date: string; views: number }[];
}
export interface GA4TrafficSource {
  channel: string;
  sessions: number;
  users: number;
  percentage: number;
}
export interface GA4TopPage {
  path: string;
  title: string;
  views: number;
  users: number;
}
export interface GA4CountryRow {
  country: string;
  sessions: number;
  users: number;
}
export interface GA4ContentRow {
  path: string;
  sessions: number;
  avgDuration: number;
  bounceRate: number;
}
export interface GA4DailyRow {
  date: string; // YYYYMMDD
  pv: number; // screenPageViews
  users: number; // activeUsers
  newUsers: number;
  avgSessionSec: number; // averageSessionDuration (초, 세션 평균)
  engagementSec: number; // userEngagementDuration (총 참여 초 — PV당 체류 계산용)
}
export interface GA4HourRow {
  hour: number; // 0~23
  sessions: number;
}

export interface ResolvedGa4 {
  propertyId: string;
  clientEmail: string;
  privateKey: string;
}

/**
 * Resolve a project's GA4 config (project row → env fallback). The PEM private
 * key arrives with literal `\n` in JSONB; un-escape it before signing. Throws
 * `AppError(501)` (graceful "not connected") when creds are absent. The
 * resolved config is consumed server-side only and never returned to the
 * client.
 */
type Ga4Row = { propertyId?: string; clientEmail?: string; privateKey?: string };

export async function resolveGa4Config(projectId: string): Promise<ResolvedGa4> {
  const admin = getSupabaseAdmin();
  let row: Ga4Row | null = null;
  if (admin && projectId) {
    const { data } = await admin
      .from('mkt_projects')
      .select('ga4_config')
      .eq('id', projectId)
      .maybeSingle();
    const ga4 = (data as { ga4_config?: Ga4Row | null } | null)?.ga4_config;
    row = ga4 ?? null;
  }
  const propertyId = row?.propertyId || config.ga4.propertyId;
  const clientEmail = row?.clientEmail || config.ga4.clientEmail;
  // Row value may carry literal "\n"; un-escape like config does.
  const privateKey = (row?.privateKey || config.ga4.privateKey || '').replace(/\\n/g, '\n');
  if (!propertyId || !clientEmail || !privateKey) {
    throw new AppError(
      501,
      'GA4가 연동되지 않았습니다. 프로젝트 설정 > 퍼널·분석에서 GA4 서비스 계정을 연결하세요.'
    );
  }
  return { propertyId, clientEmail, privateKey };
}

// ─── Pure row → viewmodel mappers (TDD unit) ──────────────────────────────────
// All faithful to the CF analytics route mappers (parseInt(…,10)/parseFloat with
// '0' fallbacks; the REST/SDK rows are { value?: string }[]).

const int = (v?: string): number => parseInt(v ?? '0', 10);
const flt = (v?: string): number => parseFloat(v ?? '0');

/** overview summary row → totals (CF overview/route.ts:54‑58). */
export function mapOverviewSummary(
  report: GA4Report
): Pick<
  GA4OverviewData,
  'totalSessions' | 'totalUsers' | 'totalPageviews' | 'bounceRate' | 'avgSessionDuration'
> {
  const row = report.rows?.[0];
  const m = row?.metricValues ?? [];
  return {
    totalSessions: int(m[0]?.value),
    totalUsers: int(m[1]?.value),
    totalPageviews: int(m[2]?.value),
    bounceRate: flt(m[3]?.value),
    avgSessionDuration: flt(m[4]?.value),
  };
}

/** daily pageviews (CF overview/route.ts:47‑50). */
export function mapDaily(report: GA4Report): GA4OverviewData['dailyPageviews'] {
  return (report.rows ?? []).map((r) => ({
    date: r.dimensionValues?.[0]?.value ?? '',
    views: int(r.metricValues?.[0]?.value),
  }));
}

/** traffic by channel with percentage + 0-total guard (CF traffic/route.ts:37‑49). */
export function mapTraffic(report: GA4Report): GA4TrafficSource[] {
  const rows = report.rows ?? [];
  const totalSessions = rows.reduce((sum, r) => sum + int(r.metricValues?.[0]?.value), 0);
  return rows.map((r) => {
    const sessions = int(r.metricValues?.[0]?.value);
    return {
      channel: r.dimensionValues?.[0]?.value ?? 'Unknown',
      sessions,
      users: int(r.metricValues?.[1]?.value),
      percentage: totalSessions > 0 ? Math.round((sessions / totalSessions) * 100) : 0,
    };
  });
}

/** top pages (CF top-pages/route.ts:40‑45). */
export function mapTopPages(report: GA4Report): GA4TopPage[] {
  return (report.rows ?? []).map((r) => ({
    path: r.dimensionValues?.[0]?.value ?? '',
    title: r.dimensionValues?.[1]?.value ?? '',
    views: int(r.metricValues?.[0]?.value),
    users: int(r.metricValues?.[1]?.value),
  }));
}

/** country traffic (CF country-traffic/route.ts:23‑27). */
export function mapCountry(report: GA4Report): GA4CountryRow[] {
  return (report.rows ?? []).map((r) => ({
    country: r.dimensionValues?.[0]?.value ?? '',
    sessions: int(r.metricValues?.[0]?.value),
    users: int(r.metricValues?.[1]?.value),
  }));
}

/** content performance (CF content-performance/route.ts:23‑28). */
export function mapContent(report: GA4Report): GA4ContentRow[] {
  return (report.rows ?? []).map((r) => ({
    path: r.dimensionValues?.[0]?.value ?? '',
    sessions: int(r.metricValues?.[0]?.value),
    avgDuration: flt(r.metricValues?.[1]?.value),
    bounceRate: flt(r.metricValues?.[2]?.value),
  }));
}

// ─── Report builders (build the runReport body per §4.2, map rows) ────────────

type Period = 'today' | 'yesterday' | '7d' | '30d';

/** Map the client period to a GA4 relative date range. */
function dateRangeFor(period: Period): { startDate: string; endDate: string } {
  switch (period) {
    case 'today':
      return { startDate: 'today', endDate: 'today' };
    case 'yesterday':
      return { startDate: 'yesterday', endDate: 'yesterday' };
    case '30d':
      return { startDate: '30daysAgo', endDate: 'today' };
    default:
      return { startDate: '7daysAgo', endDate: 'today' };
  }
}

/** overview = 2 runReport calls (summary + daily) → GA4OverviewData. */
export async function getOverview(cfg: ResolvedGa4, period: Period): Promise<GA4OverviewData> {
  const dateRanges = [dateRangeFor(period)];
  const [summary, daily] = await Promise.all([
    runReport(cfg, {
      dateRanges,
      metrics: [
        { name: 'sessions' },
        { name: 'activeUsers' },
        { name: 'screenPageViews' },
        { name: 'bounceRate' },
        { name: 'averageSessionDuration' },
      ],
    }),
    runReport(cfg, {
      dateRanges,
      metrics: [{ name: 'screenPageViews' }],
      dimensions: [{ name: 'date' }],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
    }),
  ]);
  return { period, ...mapOverviewSummary(summary), dailyPageviews: mapDaily(daily) };
}

export async function getTraffic(cfg: ResolvedGa4, period: Period): Promise<GA4TrafficSource[]> {
  const report = await runReport(cfg, {
    dateRanges: [dateRangeFor(period)],
    metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
    dimensions: [{ name: 'sessionDefaultChannelGroup' }],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 10,
  });
  return mapTraffic(report);
}

export async function getTopPages(cfg: ResolvedGa4, period: Period): Promise<GA4TopPage[]> {
  const report = await runReport(cfg, {
    dateRanges: [dateRangeFor(period)],
    metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
    dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: 15,
  });
  return mapTopPages(report);
}

export async function getCountry(cfg: ResolvedGa4, period: Period): Promise<GA4CountryRow[]> {
  const report = await runReport(cfg, {
    dateRanges: [dateRangeFor(period)],
    metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
    dimensions: [{ name: 'country' }],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 10,
  });
  return mapCountry(report);
}

export async function getContent(cfg: ResolvedGa4, period: Period): Promise<GA4ContentRow[]> {
  const report = await runReport(cfg, {
    dateRanges: [dateRangeFor(period)],
    metrics: [{ name: 'sessions' }, { name: 'averageSessionDuration' }, { name: 'bounceRate' }],
    dimensions: [{ name: 'pagePath' }],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 15,
  });
  return mapContent(report);
}

/**
 * 유입 소스/매체 (sessionSourceMedium: 'facebook / cpc', 'google / organic', '(direct) / (none)' …).
 * 메타 광고로 들어왔는지 등 실제 유입 경로 파악용. mapTraffic 재사용(dim[0]=channel 라벨).
 */
export async function getSource(cfg: ResolvedGa4, period: Period): Promise<GA4TrafficSource[]> {
  const report = await runReport(cfg, {
    dateRanges: [dateRangeFor(period)],
    metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
    dimensions: [{ name: 'sessionSourceMedium' }],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 12,
  });
  return mapTraffic(report);
}

/**
 * 앱 UI 언어별 세션 (커스텀 유저속성 `app_language` = 클라가 gtag 로 전송).
 * 🔴 GA4 관리자에서 유저-스코프 커스텀 디멘션 `app_language` 등록 + 데이터 하루+ 쌓여야 값이 나옴.
 * 미등록/데이터 없음(GA4 400/빈 응답) 시 대시보드가 안 깨지게 빈 배열 반환.
 */
export async function getLanguage(cfg: ResolvedGa4, period: Period): Promise<GA4TrafficSource[]> {
  try {
    const report = await runReport(cfg, {
      dateRanges: [dateRangeFor(period)],
      metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
      dimensions: [{ name: 'customUser:app_language' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 12,
    });
    return mapTraffic(report);
  } catch {
    return [];
  }
}

/**
 * 신규 vs 재방문 사용자 (GA4 기본 `newVsReturning`: 'new'/'returning'). 커스텀 등록 불필요.
 * mapTraffic 재사용 — 표시 숫자 = activeUsers(metric[0]), percentage = 사용자 비중.
 */
export async function getNewReturning(
  cfg: ResolvedGa4,
  period: Period
): Promise<GA4TrafficSource[]> {
  const report = await runReport(cfg, {
    dateRanges: [dateRangeFor(period)],
    metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
    dimensions: [{ name: 'newVsReturning' }],
    orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
    limit: 5,
  });
  return mapTraffic(report);
}

/**
 * 회원 vs 비회원 (커스텀 유저속성 `membership` = 'member'/'guest', 클라가 gtag 로 전송).
 * 🔴 GA4 관리자에서 유저-스코프 커스텀 디멘션 `membership` 등록 필요. 미등록 시 [] 반환.
 */
/**
 * 날짜별 리치 지표 (PV·사용자·신규·체류시간 등). 날짜별 막대차트 + 지표 pills 용.
 * 재방문 = users - newUsers, PV/사용자·PV당 체류는 클라에서 파생 계산.
 */
export async function getDaily(cfg: ResolvedGa4, period: Period): Promise<GA4DailyRow[]> {
  const report = await runReport(cfg, {
    dateRanges: [dateRangeFor(period)],
    metrics: [
      { name: 'screenPageViews' },
      { name: 'activeUsers' },
      { name: 'newUsers' },
      { name: 'averageSessionDuration' },
      { name: 'userEngagementDuration' },
    ],
    dimensions: [{ name: 'date' }],
    orderBys: [{ dimension: { dimensionName: 'date' } }],
    limit: 62,
  });
  return (report.rows ?? []).map((r) => ({
    date: r.dimensionValues?.[0]?.value ?? '',
    pv: int(r.metricValues?.[0]?.value),
    users: int(r.metricValues?.[1]?.value),
    newUsers: int(r.metricValues?.[2]?.value),
    avgSessionSec: flt(r.metricValues?.[3]?.value),
    engagementSec: flt(r.metricValues?.[4]?.value),
  }));
}

/** 디바이스 분포 (deviceCategory: desktop/mobile/tablet). mapTraffic 재사용(dim[0]=device). */
export async function getDevice(cfg: ResolvedGa4, period: Period): Promise<GA4TrafficSource[]> {
  const report = await runReport(cfg, {
    dateRanges: [dateRangeFor(period)],
    metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
    dimensions: [{ name: 'deviceCategory' }],
    orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
    limit: 5,
  });
  return mapTraffic(report);
}

/** 시간대별 세션 (GA4 `hour` 00~23). 데이터 있는 시간만 반환 — 0~23 채우기는 클라. */
export async function getHourly(cfg: ResolvedGa4, period: Period): Promise<GA4HourRow[]> {
  const report = await runReport(cfg, {
    dateRanges: [dateRangeFor(period)],
    metrics: [{ name: 'sessions' }],
    dimensions: [{ name: 'hour' }],
    orderBys: [{ dimension: { dimensionName: 'hour' } }],
    limit: 24,
  });
  return (report.rows ?? []).map((r) => ({
    hour: int(r.dimensionValues?.[0]?.value),
    sessions: int(r.metricValues?.[0]?.value),
  }));
}

export async function getMembership(cfg: ResolvedGa4, period: Period): Promise<GA4TrafficSource[]> {
  try {
    const report = await runReport(cfg, {
      dateRanges: [dateRangeFor(period)],
      metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
      dimensions: [{ name: 'customUser:membership' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: 5,
    });
    return mapTraffic(report);
  } catch {
    return [];
  }
}

// ─── Meta / YouTube analytics (server-proxy; token read server-side) ──────────
// R-1 / R-6: `meta_credentials.pages[].pageAccessToken` is resolved here and
// NEVER returned to the client or logged. The client sends only { projectId, platform }.

type MetaCredRow = { pages: MetaPage[] };

/**
 * Resolve Meta credentials for a project from the mkt_projects row.
 * No env fallback — Meta credentials are always per-project.
 * Throws AppError(501) when absent (renders "연결 필요" empty state on the client).
 */
export async function resolveMetaCredentials(projectId: string): Promise<{ pages: MetaPage[] }> {
  const admin = getSupabaseAdmin();
  if (!admin) {
    throw new AppError(501, 'Meta 연동이 필요합니다. 설정 > 채널연동에서 연결하세요.');
  }
  const { data } = await admin
    .from('mkt_projects')
    .select('meta_credentials')
    .eq('id', projectId)
    .maybeSingle();

  const row = (data as { meta_credentials?: MetaCredRow | null } | null)?.meta_credentials;
  if (!row?.pages?.length) {
    throw new AppError(501, 'Meta 연동이 필요합니다. 설정 > 채널연동에서 연결하세요.');
  }
  return { pages: row.pages };
}

// ─── Meta insight view-model types ────────────────────────────────────────────

export interface MetaOverviewMetrics {
  followers: number;
  followersGrowth: number;
  totalReach: number;
  reachGrowth: number;
  totalEngagement: number;
  engagementGrowth: number;
  avgEngagementRate: number;
  postsCount: number;
}

export interface MetaContentMetric {
  id: string;
  title: string;
  type: string;
  date: string;
  reach: number;
  impressions: number;
  engagement: number;
  engagementRate: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
}

export interface MetaInsightsResult {
  connected: boolean;
  overview: MetaOverviewMetrics;
  contents: MetaContentMetric[];
}

const DEFAULT_META_OVERVIEW: MetaOverviewMetrics = {
  followers: 0,
  followersGrowth: 0,
  totalReach: 0,
  reachGrowth: 0,
  totalEngagement: 0,
  engagementGrowth: 0,
  avgEngagementRate: 0,
  postsCount: 0,
};

/**
 * Format a number using Korean units (억/만) — faithful to CF meta-analytics-dashboard.tsx.
 * >= 100M → 억, >= 10K → 만, >= 1000 → toLocaleString, else raw string.
 */
export function formatNumber(n: number): string {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(1)}만`;
  if (n >= 1_000) return n.toLocaleString();
  return String(n);
}

// ─── Pure mappers (TDD unit — no HTTP, no side-effects) ───────────────────────

/** Raw Instagram Graph JSON → MetaInsightsResult (faithful to CF meta-analytics-dashboard.tsx:103‑136). */
export function mapInstagramInsights(data: {
  followers_count?: number;
  media_count?: number;
  media?: {
    data?: Array<{
      id?: string;
      caption?: string;
      media_type?: string;
      timestamp?: string;
      like_count?: number;
      comments_count?: number;
    }>;
  };
}): MetaInsightsResult {
  const followers = data.followers_count ?? 0;
  const postsCount = data.media_count ?? 0;

  const items = (data.media?.data ?? []).slice(0, 20);
  const contents: MetaContentMetric[] = items.map((post) => ({
    id: post.id ?? '',
    title: (post.caption ?? '').substring(0, 60),
    type: post.media_type ?? '',
    date: post.timestamp ? new Date(post.timestamp).toLocaleDateString('ko-KR') : '',
    reach: 0,
    impressions: 0,
    engagement: (post.like_count ?? 0) + (post.comments_count ?? 0),
    engagementRate: 0,
    likes: post.like_count ?? 0,
    comments: post.comments_count ?? 0,
    shares: 0,
    saves: 0,
  }));

  const totalEngagement = contents.reduce((sum, c) => sum + c.engagement, 0);
  const avgEngagementRate =
    followers > 0
      ? parseFloat(((totalEngagement / (contents.length || 1) / followers) * 100).toFixed(1))
      : 0;

  return {
    connected: true,
    overview: {
      ...DEFAULT_META_OVERVIEW,
      followers,
      postsCount,
      totalEngagement,
      avgEngagementRate,
    },
    contents,
  };
}

/** Raw Facebook Graph JSON → MetaInsightsResult (faithful to CF meta-analytics-dashboard.tsx:137‑167). */
export function mapFacebookInsights(data: {
  fan_count?: number;
  posts?: {
    data?: Array<{
      id?: string;
      message?: string;
      created_time?: string;
      likes?: { summary?: { total_count?: number } };
      comments?: { summary?: { total_count?: number } };
      shares?: { count?: number };
    }>;
  };
}): MetaInsightsResult {
  const followers = data.fan_count ?? 0;

  const items = (data.posts?.data ?? []).slice(0, 20);
  const contents: MetaContentMetric[] = items.map((post) => ({
    id: post.id ?? '',
    title: (post.message ?? '').substring(0, 60),
    type: 'POST',
    date: post.created_time ? new Date(post.created_time).toLocaleDateString('ko-KR') : '',
    reach: 0,
    impressions: 0,
    engagement:
      (post.likes?.summary?.total_count ?? 0) + (post.comments?.summary?.total_count ?? 0),
    engagementRate: 0,
    likes: post.likes?.summary?.total_count ?? 0,
    comments: post.comments?.summary?.total_count ?? 0,
    shares: post.shares?.count ?? 0,
    saves: 0,
  }));

  const totalEngagement = contents.reduce((sum, c) => sum + c.engagement, 0);
  const avgEngagementRate =
    followers > 0
      ? parseFloat(((totalEngagement / (contents.length || 1) / followers) * 100).toFixed(1))
      : 0;

  return {
    connected: true,
    overview: {
      ...DEFAULT_META_OVERVIEW,
      followers,
      postsCount: contents.length,
      totalEngagement,
      avgEngagementRate,
    },
    contents,
  };
}

// ─── Service functions (HTTP + mapping) ───────────────────────────────────────

/**
 * Fetch Meta page/media insights for a project + platform.
 * Resolves `meta_credentials` server-side (R-1/R-6); token never returned.
 * `platform === 'threads'` has no public API → returns empty MetaInsightsResult.
 */
export async function getMetaInsights(
  projectId: string,
  platform: string,
  _country?: string
): Promise<MetaInsightsResult> {
  const { pages } = await resolveMetaCredentials(projectId);
  const page = pages[0];

  if (platform === 'instagram') {
    const { raw } = await getPageMediaInsights(page, 'instagram');
    return mapInstagramInsights(raw as Parameters<typeof mapInstagramInsights>[0]);
  }

  if (platform === 'facebook') {
    const { raw } = await getPageMediaInsights(page, 'facebook');
    return mapFacebookInsights(raw as Parameters<typeof mapFacebookInsights>[0]);
  }

  // Threads — no public insights API
  return {
    connected: true,
    overview: { ...DEFAULT_META_OVERVIEW },
    contents: [],
  };
}

/**
 * Dispatch YouTube Data API actions (faithful to CF's `ytApi` + `analyzeYoutubeChannel`).
 * Returns raw Google JSON so the client hook can port the parsing verbatim.
 */
export async function getYoutubeChannel(
  action: string,
  params: Record<string, unknown>
): Promise<unknown> {
  switch (action) {
    case 'searchChannel': {
      const query = String(params.query ?? '');
      return searchChannels(query, 1);
    }
    case 'getChannel': {
      const channelId = String(params.channelId ?? '');
      return getChannelInfo(channelId);
    }
    case 'getVideos': {
      const channelId = String(params.channelId ?? '');
      const maxResults = Number(params.maxResults ?? 20);
      return getChannelVideos(channelId, maxResults);
    }
    case 'getVideoStats': {
      const ids = String(params.videoIds ?? '');
      return getVideoStats(ids.split(',').filter(Boolean));
    }
    default:
      throw new AppError(400, `Unknown YouTube action: ${action}`);
  }
}
