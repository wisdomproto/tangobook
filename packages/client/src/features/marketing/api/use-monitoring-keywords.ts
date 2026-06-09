import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, getCurrentUserId } from './supabase';
import { mktKeys } from './queries';
import type { MonitoringKeyword } from '../types/database';

// supabase-direct lane — the hooks call the marketing supabase client directly.
// RLS on mkt_monitoring_keywords is single-owner (`with check (user_id = auth.uid())`),
// so every insert MUST stamp user_id from getCurrentUserId() — R-B.

// ─── Queries ──────────────────────────────────────────────────────────────────

/** Fetch all monitoring keywords for a project, ordered by sort_order ASC. */
export function useMonitoringKeywords(projectId: string) {
  return useQuery({
    queryKey: mktKeys.monitoringKeywords(projectId),
    enabled: !!projectId,
    queryFn: async (): Promise<MonitoringKeyword[]> => {
      const { data, error } = await supabase
        .from('mkt_monitoring_keywords')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order');
      if (error) throw new Error(error.message);
      return (data ?? []) as MonitoringKeyword[];
    },
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Add a monitoring keyword. Stamps user_id — R-B (single-owner RLS).
 *
 * The table has a `unique(project_id, keyword, search_engine)` constraint. Adding a
 * duplicate keyword is treated as a no-op success (we swallow the 23505 unique-violation)
 * so the UI does not crash when the operator re-adds an existing keyword.
 */
export function useAddMonitoringKeyword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      projectId: string;
      keyword: string;
      searchEngine?: 'naver' | 'google';
    }) => {
      const user_id = await getCurrentUserId();
      const { error } = await supabase.from('mkt_monitoring_keywords').insert({
        user_id,
        project_id: input.projectId,
        keyword: input.keyword,
        search_engine: input.searchEngine ?? 'naver',
        is_golden: false,
        sort_order: 0,
      });
      if (error && !isDuplicateError(error)) throw new Error(error.message);
      return input;
    },
    onSuccess: ({ projectId }) => {
      void queryClient.invalidateQueries({
        queryKey: mktKeys.monitoringKeywords(projectId),
      });
    },
  });
}

/** Remove a monitoring keyword by id. RLS scopes the delete; no stamp. */
export function useRemoveMonitoringKeyword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string; projectId: string }) => {
      const { error } = await supabase.from('mkt_monitoring_keywords').delete().eq('id', input.id);
      if (error) throw new Error(error.message);
      return input;
    },
    onSuccess: ({ projectId }) => {
      void queryClient.invalidateQueries({
        queryKey: mktKeys.monitoringKeywords(projectId),
      });
    },
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Postgres unique-violation: code 23505, or a message indicating a duplicate key. */
function isDuplicateError(error: { code?: string; message?: string }): boolean {
  return error.code === '23505' || /duplicate key|unique constraint/i.test(error.message ?? '');
}
