import { useQuery, useMutation } from '@tanstack/react-query';
import { mktKeys } from './queries';
import type {
  GA4OverviewData,
  GA4TrafficSource,
  GA4TopPage,
  GA4CountryRow,
  GA4ContentRow,
  SeoAuditResult,
} from '../types/analytics';

// ─── Server-proxy POST helper ─────────────────────────────────────────────────
// Sends only safe data (projectId + period) to Express — never creds.
// On success ({ success: true, data }) → returns data.
// On 501 (GA4/Meta not connected) → returns null instead of throwing so the
// dashboard renders the "연결 필요" empty-state rather than an error banner.

async function postMkt<T>(path: string, body: unknown): Promise<T | null> {
  const res = await fetch('/api/mkt' + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  // 501 = GA4/Meta not configured — treat as "not connected", NOT an error.
  if (res.status === 501) {
    return null;
  }

  const json = (await res
    .json()
    .catch(() => ({}) as { success?: boolean; data?: T; error?: string })) as {
    success?: boolean;
    data?: T;
    error?: string;
    message?: string;
  };

  if (!res.ok || !json.success) {
    throw new Error(json.error || json.message || `요청 실패 (HTTP ${res.status})`);
  }

  return (json.data ?? null) as T | null;
}

// ─── GA4 query hooks ──────────────────────────────────────────────────────────
// Each hook is enabled only when `enabled` is true (defaults to !!projectId).
// The component passes `enabled = hasGa4 && !!projectId` so all five fire
// together only when GA4 is configured.
// staleTime = 5 min so switching period/project re-fetches but normal navigation hits cache.

const STALE_TIME = 5 * 60 * 1_000; // 5 minutes

/** POST /api/mkt/analytics/overview  Body: { projectId, period } */
export function useGa4Overview(
  projectId: string,
  period: '7d' | '30d' = '7d',
  enabled = !!projectId
) {
  return useQuery({
    queryKey: mktKeys.analyticsOverview(projectId, period),
    enabled: enabled && !!projectId,
    staleTime: STALE_TIME,
    queryFn: () => postMkt<GA4OverviewData>('/analytics/overview', { projectId, period }),
  });
}

/** POST /api/mkt/analytics/traffic  Body: { projectId, period } */
export function useGa4Traffic(
  projectId: string,
  period: '7d' | '30d' = '30d',
  enabled = !!projectId
) {
  return useQuery({
    queryKey: mktKeys.analyticsTraffic(projectId, period),
    enabled: enabled && !!projectId,
    staleTime: STALE_TIME,
    queryFn: () => postMkt<GA4TrafficSource[]>('/analytics/traffic', { projectId, period }),
  });
}

/** POST /api/mkt/analytics/top-pages  Body: { projectId, period } */
export function useGa4TopPages(
  projectId: string,
  period: '7d' | '30d' = '30d',
  enabled = !!projectId
) {
  return useQuery({
    queryKey: mktKeys.analyticsTopPages(projectId, period),
    enabled: enabled && !!projectId,
    staleTime: STALE_TIME,
    queryFn: () => postMkt<GA4TopPage[]>('/analytics/top-pages', { projectId, period }),
  });
}

/** POST /api/mkt/analytics/country-traffic  Body: { projectId, period } */
export function useGa4Country(
  projectId: string,
  period: '7d' | '30d' = '30d',
  enabled = !!projectId
) {
  return useQuery({
    queryKey: mktKeys.analyticsCountry(projectId, period),
    enabled: enabled && !!projectId,
    staleTime: STALE_TIME,
    queryFn: () => postMkt<GA4CountryRow[]>('/analytics/country-traffic', { projectId, period }),
  });
}

/** POST /api/mkt/analytics/content-performance  Body: { projectId, period } */
export function useGa4Content(
  projectId: string,
  period: '7d' | '30d' = '30d',
  enabled = !!projectId
) {
  return useQuery({
    queryKey: mktKeys.analyticsContent(projectId, period),
    enabled: enabled && !!projectId,
    staleTime: STALE_TIME,
    queryFn: () =>
      postMkt<GA4ContentRow[]>('/analytics/content-performance', { projectId, period }),
  });
}

// ─── SEO mutations (transient) ────────────────────────────────────────────────
// These are triggered by user actions (URL submit / form submit) and are NOT
// cached in TanStack Query — they are transient mutations.

/** POST /api/mkt/seo/audit  Body: { url } */
export function useSeoAudit() {
  return useMutation({
    mutationFn: (url: string) =>
      postMkt<SeoAuditResult>('/seo/audit', { url }) as Promise<SeoAuditResult | null>,
  });
}

/** POST /api/mkt/seo/crawl  Body: { url } */
export function useSeoCrawl() {
  return useMutation({
    mutationFn: (url: string) =>
      postMkt<{ text: string; analysis?: unknown }>('/seo/crawl', { url }),
  });
}

/** POST /api/mkt/seo/schema-generate  Body: { content, schemaType, language? } */
export function useSchemaGenerate() {
  return useMutation({
    mutationFn: (args: { content: string; schemaType: string; language?: string }) =>
      postMkt<{ schema: string }>('/seo/schema-generate', args),
  });
}
