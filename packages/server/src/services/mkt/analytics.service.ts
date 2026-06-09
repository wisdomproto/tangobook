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

type Period = '7d' | '30d';

/** `'7d'→'7daysAgo'`, anything else → `'30daysAgo'`. The client always sends a period. */
function startDateFor(period: Period): string {
  return period === '30d' ? '30daysAgo' : '7daysAgo';
}

/** overview = 2 runReport calls (summary + daily) → GA4OverviewData. */
export async function getOverview(cfg: ResolvedGa4, period: Period): Promise<GA4OverviewData> {
  const dateRanges = [{ startDate: startDateFor(period), endDate: 'today' }];
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
    dateRanges: [{ startDate: startDateFor(period), endDate: 'today' }],
    metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
    dimensions: [{ name: 'sessionDefaultChannelGroup' }],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 10,
  });
  return mapTraffic(report);
}

export async function getTopPages(cfg: ResolvedGa4, period: Period): Promise<GA4TopPage[]> {
  const report = await runReport(cfg, {
    dateRanges: [{ startDate: startDateFor(period), endDate: 'today' }],
    metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
    dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: 15,
  });
  return mapTopPages(report);
}

export async function getCountry(cfg: ResolvedGa4, period: Period): Promise<GA4CountryRow[]> {
  const report = await runReport(cfg, {
    dateRanges: [{ startDate: startDateFor(period), endDate: 'today' }],
    metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
    dimensions: [{ name: 'country' }],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 10,
  });
  return mapCountry(report);
}

export async function getContent(cfg: ResolvedGa4, period: Period): Promise<GA4ContentRow[]> {
  const report = await runReport(cfg, {
    dateRanges: [{ startDate: startDateFor(period), endDate: 'today' }],
    metrics: [{ name: 'sessions' }, { name: 'averageSessionDuration' }, { name: 'bounceRate' }],
    dimensions: [{ name: 'pagePath' }],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 15,
  });
  return mapContent(report);
}
