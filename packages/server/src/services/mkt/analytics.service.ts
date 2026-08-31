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
/** One storybook's aggregated traffic (all of its paths merged by book id). */
export interface GA4BookRow {
  bookId: string;
  title: string; // GA4 pageTitle fallback (client enriches with the real book title/cover)
  views: number;
  users: number;
  sessions: number;
  avgDuration: number; // 조회 1회당 체류(초) = userEngagementDuration / screenPageViews
}
/** 동화책별 인기 = books (grouped) + others (non-book pages: landing/library hub/games…). */
export interface GA4TopBooksResult {
  books: GA4BookRow[];
  others: GA4TopPage[];
}
/**
 * PWA "홈에 설치" 누적 지표.
 * - `installs`: `pwa_install` 이벤트 수 (Android/데스크톱 Chrome 실설치 — iOS 미포함).
 * - `standaloneUsers`: `pwa_standalone` 이벤트 사용자 수 (홈에서 실행 중인 기기 — iOS 포함 추정).
 */
export interface GA4PwaInstalls {
  installs: number;
  standaloneUsers: number;
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

/**
 * 🔴 **책 고르는 화면(`/library`)에 머문 시간은 체류시간에서 뺀다** (2026-07-27).
 * 그 화면은 배경음만 틀어놓고 켜둔 채 두는 사람이 있어서, 세션 평균을 통째로 부풀린다.
 * 우리가 알고 싶은 건 "콘텐츠를 실제로 본 시간"이다.
 *
 * 🔴 **`/library/<id>`(책 상세)는 뺄 이유가 없다** — 거기 머문 건 그 책을 본 것이다.
 * 그래서 접두사 매칭이 아니라 **정확히 그 경로**만 본다(언어 프리픽스 `/en/library` 포함).
 */
export function isIdleBrowsePath(path: string): boolean {
  const clean = (path.split('?')[0] ?? '').replace(/\/+$/, '') || '/';
  return /^(\/[a-z]{2})?\/library$/.test(clean);
}

/** pagePath × userEngagementDuration 리포트 → 제외 경로를 뺀 참여 시간 합(초). */
export function sumEngagementExcludingIdle(report: GA4Report): number {
  return (report.rows ?? []).reduce((sum, r) => {
    const path = r.dimensionValues?.[0]?.value ?? '';
    return isIdleBrowsePath(path) ? sum : sum + flt(r.metricValues?.[0]?.value);
  }, 0);
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

// Leading UI-language prefix (only meaningful in front of `/library/…/about`).
const LANG_PREFIX_RE = /^\/(?:ko|en|ja|zh|vi|th|es|fr|de|ms|id)(?=\/library\/)/;

/**
 * Extract the storybook id a GA4 pagePath belongs to, or null for non-book pages.
 * Book paths: `/library/:id`, `/library/:id/about`, `/:lang/library/:id/about`,
 * `/viewer/:id`. Excludes the phonics hub (`/library/phonics…`) and any deeper path.
 */
export function extractBookId(pathRaw: string): string | null {
  if (!pathRaw) return null;
  let p = pathRaw.split(/[?#]/)[0].replace(LANG_PREFIX_RE, '');
  if (p.length > 1) p = p.replace(/\/$/, ''); // drop trailing slash (keep bare "/")
  const lib = p.match(/^\/library\/([^/]+)(?:\/about)?$/);
  if (lib) return lib[1] === 'phonics' ? null : lib[1];
  const viewer = p.match(/^\/viewer\/([^/]+)$/);
  if (viewer) return viewer[1];
  return null;
}

/**
 * Group GA4 page rows (dims [pagePath, pageTitle], metrics [views, users,
 * sessions, userEngagementDuration]) by book id. Non-book rows are returned
 * separately as `others` (GA4TopPage shape).
 *
 * 🔴 **체류는 `userEngagementDuration` ÷ 조회수**다(2026-08-04). 예전엔
 *    `averageSessionDuration` 을 세션 가중했는데, 그건 **세션 단위** 지표라 쪽으로 못 가른다 —
 *    GA4 는 세션 길이를 「마지막 이벤트 − 첫 이벤트」로 재므로 **한 쪽만 보고 나간 세션은 0초**다.
 *    그래서 블로그로 들어와 책 한 권만 본 방문자가 전부 「체류 0:00」으로 찍혔고, 값이 하나도
 *    안 갈리는 게(모든 책이 0:00) 행동이 아니라 계측이라는 신호였다.
 *    `getOverview` 는 이미 이 지표로 바꿔 놓고 책별 표만 안 바꿨던 것.
 */
export function mapTopBooks(report: GA4Report, bookLimit = 15, otherLimit = 8): GA4TopBooksResult {
  const byBook = new Map<
    string,
    {
      views: number;
      users: number;
      sessions: number;
      engagementSec: number;
      title: string;
      topViews: number;
    }
  >();
  const others: GA4TopPage[] = [];

  for (const r of report.rows ?? []) {
    const path = r.dimensionValues?.[0]?.value ?? '';
    const title = r.dimensionValues?.[1]?.value ?? '';
    const views = int(r.metricValues?.[0]?.value);
    const users = int(r.metricValues?.[1]?.value);
    const sessions = int(r.metricValues?.[2]?.value);
    const engagementSec = flt(r.metricValues?.[3]?.value);

    const bookId = extractBookId(path);
    if (!bookId) {
      others.push({ path, title, views, users });
      continue;
    }
    const acc = byBook.get(bookId) ?? {
      views: 0,
      users: 0,
      sessions: 0,
      engagementSec: 0,
      title: '',
      topViews: -1,
    };
    acc.views += views;
    acc.users += users;
    acc.sessions += sessions;
    acc.engagementSec += engagementSec;
    // Representative title = the title of this book's highest-traffic path.
    if (title && views > acc.topViews) {
      acc.title = title;
      acc.topViews = views;
    }
    byBook.set(bookId, acc);
  }

  const books: GA4BookRow[] = Array.from(byBook.entries())
    .map(([bookId, a]) => ({
      bookId,
      title: a.title,
      views: a.views,
      users: a.users,
      sessions: a.sessions,
      // 조회 1회당 머문 초. 🔴 세션이 아니라 **조회수**로 나눈다 — 한 세션이 그 책의 여러 쪽을
      // 볼 수 있고(상세→뷰어), 우리가 알고 싶은 건 「한 번 열었을 때 얼마나 머무는가」다.
      avgDuration: a.views > 0 ? a.engagementSec / a.views : 0,
    }))
    .sort((x, y) => y.views - x.views)
    .slice(0, bookLimit);

  others.sort((x, y) => y.views - x.views);
  return { books, others: others.slice(0, otherLimit) };
}

/**
 * PWA 설치 지표 매퍼 — rows dims [eventName], metrics [eventCount, totalUsers].
 * `pwa_install` 은 eventCount(설치 횟수), `pwa_standalone` 은 totalUsers(고유 기기).
 */
export function mapPwaInstalls(report: GA4Report): GA4PwaInstalls {
  let installs = 0;
  let standaloneUsers = 0;
  for (const r of report.rows ?? []) {
    const name = r.dimensionValues?.[0]?.value ?? '';
    if (name === 'pwa_install') installs = int(r.metricValues?.[0]?.value);
    else if (name === 'pwa_standalone') standaloneUsers = int(r.metricValues?.[1]?.value);
  }
  return { installs, standaloneUsers };
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

/**
 * 저작도구(/editor2) 페이지는 내부 작업 트래픽이라 마케팅 사이트 분석에서 제외한다.
 * `pagePath` 는 event-scoped 라 이 필터를 붙이면 editor2 이벤트/페이지뷰가 집계에서 빠지고,
 * editor2 **만** 방문한 세션도 제외된다(다른 페이지도 본 세션은 유지 — 세션-스코프 지표는 매칭
 * 이벤트가 하나라도 있으면 세션을 센다). BEGINS_WITH 라 `/editor2`·`/editor2/:bid` 등 하위 경로도
 * 모두 걸리고, v1 백업 `/editor` 는 `/editor2` 로 시작하지 않아 영향 없다.
 */
export const EXCLUDE_EDITOR2_FILTER: Record<string, unknown> = {
  notExpression: {
    filter: {
      fieldName: 'pagePath',
      stringFilter: { matchType: 'BEGINS_WITH', value: '/editor2' },
    },
  },
};

/** overview = 2 runReport calls (summary + daily) → GA4OverviewData. */
export async function getOverview(cfg: ResolvedGa4, period: Period): Promise<GA4OverviewData> {
  const dateRanges = [dateRangeFor(period)];
  const [summary, daily, byPage] = await Promise.all([
    runReport(cfg, {
      dateRanges,
      metrics: [
        { name: 'sessions' },
        { name: 'activeUsers' },
        { name: 'screenPageViews' },
        { name: 'bounceRate' },
        { name: 'averageSessionDuration' },
      ],
      dimensionFilter: EXCLUDE_EDITOR2_FILTER,
    }),
    runReport(cfg, {
      dateRanges,
      metrics: [{ name: 'screenPageViews' }],
      dimensions: [{ name: 'date' }],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
      dimensionFilter: EXCLUDE_EDITOR2_FILTER,
    }),
    // 체류시간에서 `/library` 를 빼려면 **쪽별** 참여 시간이 필요하다 —
    // `averageSessionDuration` 은 세션 단위라 페이지로 못 가른다.
    runReport(cfg, {
      dateRanges,
      metrics: [{ name: 'userEngagementDuration' }],
      dimensions: [{ name: 'pagePath' }],
      orderBys: [{ metric: { metricName: 'userEngagementDuration' }, desc: true }],
      limit: 500,
      dimensionFilter: EXCLUDE_EDITOR2_FILTER,
    }),
  ]);
  const base = mapOverviewSummary(summary);
  const engagedSec = sumEngagementExcludingIdle(byPage);
  return {
    period,
    ...base,
    // 세션이 0이면 나눌 수 없다. 쪽별 리포트가 비면(0초) 원래 값을 그대로 둔다 —
    // 데이터가 없는 것과 "체류가 0" 은 다르다.
    avgSessionDuration:
      base.totalSessions > 0 && engagedSec > 0
        ? engagedSec / base.totalSessions
        : base.avgSessionDuration,
    dailyPageviews: mapDaily(daily),
  };
}

export async function getTraffic(cfg: ResolvedGa4, period: Period): Promise<GA4TrafficSource[]> {
  const report = await runReport(cfg, {
    dateRanges: [dateRangeFor(period)],
    metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
    dimensions: [{ name: 'sessionDefaultChannelGroup' }],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 10,
    dimensionFilter: EXCLUDE_EDITOR2_FILTER,
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
    dimensionFilter: EXCLUDE_EDITOR2_FILTER,
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
    dimensionFilter: EXCLUDE_EDITOR2_FILTER,
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
    dimensionFilter: EXCLUDE_EDITOR2_FILTER,
  });
  return mapContent(report);
}

/**
 * 동화책별 인기 — pull a wide slice of page rows (one book spans up to ~4 paths
 * across ~149 books), then group by book id server-side. Non-book pages come
 * back as `others`.
 */
export async function getTopBooks(cfg: ResolvedGa4, period: Period): Promise<GA4TopBooksResult> {
  const report = await runReport(cfg, {
    dateRanges: [dateRangeFor(period)],
    metrics: [
      { name: 'screenPageViews' },
      { name: 'activeUsers' },
      { name: 'sessions' },
      // 🔴 세션 평균이 아니라 **쪽별 참여 시간**. 위 `mapTopBooks` 주석 참고.
      { name: 'userEngagementDuration' },
    ],
    dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: 300,
    dimensionFilter: EXCLUDE_EDITOR2_FILTER,
  });
  return mapTopBooks(report);
}

// 누적 집계용 전체 기간 시작일 — GA4 데이터 보존 한도 내에서 클램프됨(현재 속성 기준 사실상 전체).
const ALL_TIME_START = '2020-01-01';

/**
 * PWA "홈에 설치" 누적 — 기간 토글과 무관하게 전체 기간을 조회한다.
 * eventName in [pwa_install, pwa_standalone] 로 필터해 두 이벤트만 가져온다.
 */
export async function getPwaInstalls(cfg: ResolvedGa4): Promise<GA4PwaInstalls> {
  const report = await runReport(cfg, {
    dateRanges: [{ startDate: ALL_TIME_START, endDate: 'today' }],
    metrics: [{ name: 'eventCount' }, { name: 'totalUsers' }],
    dimensions: [{ name: 'eventName' }],
    dimensionFilter: {
      filter: {
        fieldName: 'eventName',
        inListFilter: { values: ['pwa_install', 'pwa_standalone'] },
      },
    },
  });
  return mapPwaInstalls(report);
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
    dimensionFilter: EXCLUDE_EDITOR2_FILTER,
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
      dimensionFilter: EXCLUDE_EDITOR2_FILTER,
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
    dimensionFilter: EXCLUDE_EDITOR2_FILTER,
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
    dimensionFilter: EXCLUDE_EDITOR2_FILTER,
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
    dimensionFilter: EXCLUDE_EDITOR2_FILTER,
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
    dimensionFilter: EXCLUDE_EDITOR2_FILTER,
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
      dimensionFilter: EXCLUDE_EDITOR2_FILTER,
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
