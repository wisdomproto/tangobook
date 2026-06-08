import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { mktKeys } from './queries';
import type { Project } from '../types/database';
import type { SavedKeyword } from '../types/database';

// ─── Read (derived from project cache) ───────────────────────────────────────

/**
 * Read saved_keywords from the cached project row (no extra query).
 * Returns [] when the project is not loaded or saved_keywords is null.
 */
export function useSavedKeywords(projectId: string): SavedKeyword[] {
  const queryClient = useQueryClient();
  const project = queryClient.getQueryData<Project>(mktKeys.project(projectId));
  return project?.saved_keywords ?? [];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCurrent(
  queryClient: ReturnType<typeof useQueryClient>,
  projectId: string
): SavedKeyword[] {
  const project = queryClient.getQueryData<Project>(mktKeys.project(projectId));
  return project?.saved_keywords ?? [];
}

async function writeSavedKeywords(projectId: string, keywords: SavedKeyword[]): Promise<void> {
  const { error } = await supabase
    .from('mkt_projects')
    .update({ saved_keywords: keywords, updated_at: new Date().toISOString() })
    .eq('id', projectId);
  if (error) throw new Error(error.message);
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Add a keyword to saved_keywords (dedup by keyword name).
 * Writes via update on the owner project row — no user_id stamp (RLS satisfied).
 */
export function useAddSavedKeyword(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (kw: SavedKeyword) => {
      const current = getCurrent(queryClient, projectId);
      // Dedup: skip if already saved
      if (current.some((s) => s.keyword === kw.keyword)) {
        await writeSavedKeywords(projectId, current);
        return current;
      }
      const next = [...current, kw];
      await writeSavedKeywords(projectId, next);
      return next;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: mktKeys.project(projectId) });
    },
  });
}

/**
 * Remove a keyword from saved_keywords by keyword string.
 */
export function useRemoveSavedKeyword(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (keyword: string) => {
      const current = getCurrent(queryClient, projectId);
      const next = current.filter((s) => s.keyword !== keyword);
      await writeSavedKeywords(projectId, next);
      return next;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: mktKeys.project(projectId) });
    },
  });
}

/**
 * Clear all saved_keywords.
 */
export function useClearSavedKeywords(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await writeSavedKeywords(projectId, []);
      return [];
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: mktKeys.project(projectId) });
    },
  });
}
