import { useMutation } from '@tanstack/react-query';
import { postMkt } from './use-analytics';
import type {
  CompetitorGapItem,
  CompetitorStrengthItem,
  CompetitorRankingItem,
  SuggestedCompetitor,
} from '../types/analytics';
import type { SerpResultItem } from '../types/monitoring';

// ─── Response shapes (faithful to competitors.controller.ts) ─────────────────

export interface GapAnalysisResult {
  gaps: CompetitorGapItem[];
  strengths: CompetitorStrengthItem[];
}

export interface KeywordRankingsResult {
  rankings: CompetitorRankingItem[];
}

export interface SuggestCompetitorsResult {
  competitors: SuggestedCompetitor[];
}

// ─── Graceful-error wrapper ──────────────────────────────────────────────────
// 502 (Gemini/DataForSEO creds absent or upstream failure) → returns null
// instead of crashing the dashboard.  The component renders an empty-state.

async function postMktGraceful<T>(path: string, body: unknown): Promise<T | null> {
  try {
    return await postMkt<T>(path, body);
  } catch {
    // e.g. network failure or server 5xx — surface empty state, not white screen
    return null;
  }
}

// ─── Mutations (transient — not cached; triggered by user action) ─────────────

/**
 * POST /api/mkt/competitors/suggest
 * Body: { industry, services, targetCustomer?, usp? }
 * Returns suggested competitor list or null on failure.
 */
export function useSuggestCompetitors() {
  return useMutation({
    mutationFn: (args: {
      industry: string;
      services: string;
      targetCustomer?: string;
      usp?: string;
    }) =>
      postMktGraceful<SuggestCompetitorsResult>('/competitors/suggest', args).then(
        (r) => r?.competitors ?? []
      ),
  });
}

/**
 * POST /api/mkt/competitors/gap-analysis
 * Body: { projectUrl, competitorUrls, keywords?, industry? }
 * Returns { gaps, strengths } or empty arrays on failure.
 */
export function useGapAnalysis() {
  return useMutation({
    mutationFn: (args: {
      projectUrl: string;
      competitorUrls: string[];
      keywords?: string[];
      industry?: string;
    }) =>
      postMktGraceful<GapAnalysisResult>('/competitors/gap-analysis', args).then((r) => ({
        gaps: r?.gaps ?? [],
        strengths: r?.strengths ?? [],
      })),
  });
}

/**
 * POST /api/mkt/competitors/keyword-rankings
 * Body: { projectUrl?, competitorUrls?, keywords }
 * Returns rankings array or empty array on failure.
 */
export function useKeywordRankings() {
  return useMutation({
    mutationFn: (args: { projectUrl?: string; competitorUrls?: string[]; keywords: string[] }) =>
      postMktGraceful<KeywordRankingsResult>('/competitors/keyword-rankings', args).then(
        (r) => r?.rankings ?? []
      ),
  });
}

/**
 * POST /api/mkt/competitors/serp
 * Body: { keyword, language? } — NO secret; DataForSEO creds live on the server.
 * Returns SERP result items, or an empty array on 502 (no creds) / failure.
 */
export function useCompetitorSerp() {
  return useMutation({
    mutationFn: (args: { keyword: string; language?: string }) =>
      postMktGraceful<{ items: SerpResultItem[] }>('/competitors/serp', args).then(
        (r) => r?.items ?? []
      ),
  });
}
