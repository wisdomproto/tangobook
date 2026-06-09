import { useMutation } from '@tanstack/react-query';
import { postMkt } from './use-analytics';
import type { MonitoringFeedItem } from '../types/monitoring';

// ─── Monitoring mutations (transient — not cached; triggered by user action) ──
// Bodies carry only safe data (projectId/keyword/content text) — never creds.
// `postMkt` unwraps `.data` and maps 501 → null, so the `?? []` / `?? ''`
// fallbacks let a not-configured server degrade gracefully (empty state).

/**
 * POST /api/mkt/monitoring/search
 * Body: { projectId, keyword, language, sources? }
 * Returns matched feed items or [] on null/501.
 */
export function useMonitoringSearch() {
  return useMutation({
    mutationFn: (args: {
      projectId: string;
      keyword: string;
      language: string;
      sources?: string[];
    }) =>
      postMkt<{ items: MonitoringFeedItem[] }>('/monitoring/search', args).then(
        (r) => r?.items ?? []
      ),
  });
}

/**
 * POST /api/mkt/monitoring/comment
 * Body: { contentText, platform, tone, language, projectContext? }
 * Returns the generated comment or '' on null/501.
 */
export function useMonitoringComment() {
  return useMutation({
    mutationFn: (args: {
      contentText: string;
      platform: string;
      tone: string;
      language: string;
      projectContext?: string;
    }) => postMkt<{ comment: string }>('/monitoring/comment', args).then((r) => r?.comment ?? ''),
  });
}
