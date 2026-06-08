import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, getCurrentUserId } from './supabase';
import { mktKeys } from './queries';
import type { PublishRecord } from '../types/database';

// ─── Pure Helpers ─────────────────────────────────────────────────────────────

export interface BulkInsertRow {
  user_id: string;
  content_id: string;
  project_id: string;
  language: string;
  channel: string;
  status: string;
  scheduled_at: string;
}

export interface BulkInsertResult {
  toInsert: BulkInsertRow[];
  skipped: number;
}

/**
 * Pure skip-on-conflict helper for bulk schedule.
 * Filters out rows whose (contentId, language) already appears in existingKey,
 * stamps user_id + channel:'self_hosted' + status:'scheduled' on each inserted row.
 */
export function computeBulkInsertRows(
  rows: { contentId: string; projectId: string; language: string; scheduledAt: string }[],
  existingKey: Set<string>,
  uid: string
): BulkInsertResult {
  const toInsert = rows
    .filter((r) => !existingKey.has(`${r.contentId}::${r.language}`))
    .map((r) => ({
      user_id: uid,
      content_id: r.contentId,
      project_id: r.projectId,
      language: r.language,
      channel: 'self_hosted',
      status: 'scheduled',
      scheduled_at: r.scheduledAt,
    }));
  return { toInsert, skipped: rows.length - toInsert.length };
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Fetch all publish records for a project, ordered by scheduled_at ASC (nulls last).
 */
export function usePublishRecords(projectId: string) {
  return useQuery({
    queryKey: mktKeys.publishRecords(projectId),
    enabled: !!projectId,
    queryFn: async (): Promise<PublishRecord[]> => {
      const { data, error } = await supabase
        .from('mkt_publish_records')
        .select('*')
        .eq('project_id', projectId)
        .order('scheduled_at', { nullsFirst: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as PublishRecord[];
    },
  });
}

/**
 * Fetch aggregated counts by language and status for the project.
 * Returns Record<language, { scheduled: number; published: number }>.
 */
export function useFetchPublishCountsByLanguage(projectId: string) {
  return useQuery({
    queryKey: mktKeys.publishCounts(projectId),
    enabled: !!projectId,
    queryFn: async (): Promise<Record<string, { scheduled: number; published: number }>> => {
      const { data, error } = await supabase
        .from('mkt_publish_records')
        .select('language, status')
        .eq('project_id', projectId)
        .eq('channel', 'self_hosted');
      if (error) throw new Error(error.message);

      const result: Record<string, { scheduled: number; published: number }> = {};
      for (const row of data ?? []) {
        const lang = row.language as string;
        const status = row.status as string;
        if (!result[lang]) result[lang] = { scheduled: 0, published: 0 };
        if (status === 'scheduled') result[lang].scheduled++;
        if (status === 'published') result[lang].published++;
      }
      return result;
    },
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/** Schedule (upsert) a single publish record. Stamps user_id — R-4. */
export function useSchedulePublish() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      projectId: string;
      contentId: string;
      language: string;
      scheduledAt: string;
    }) => {
      const uid = await getCurrentUserId();
      const row = {
        user_id: uid,
        content_id: input.contentId,
        project_id: input.projectId,
        language: input.language,
        channel: 'self_hosted',
        status: 'scheduled',
        scheduled_at: input.scheduledAt,
      };
      const { data, error } = await supabase
        .from('mkt_publish_records')
        .upsert(row, { onConflict: 'content_id,language,channel', ignoreDuplicates: false })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as PublishRecord;
    },
    onSuccess: (record) => {
      void queryClient.invalidateQueries({
        queryKey: mktKeys.publishRecords(record.project_id),
      });
      void queryClient.invalidateQueries({
        queryKey: mktKeys.publishCounts(record.project_id),
      });
    },
  });
}

/** Bulk-schedule multiple publish records with skip-on-conflict. Stamps user_id — R-4. */
export function useBulkSchedulePublish() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      projectId: string;
      rows: { contentId: string; language: string; scheduledAt: string }[];
    }): Promise<{ inserted: number; skipped: number }> => {
      const uid = await getCurrentUserId();
      const contentIds = [...new Set(input.rows.map((r) => r.contentId))];

      // Pre-check which (content_id, language) pairs are already live
      const { data: liveRows, error: liveErr } = await supabase
        .from('mkt_publish_records')
        .select('content_id, language')
        .in('content_id', contentIds)
        .eq('channel', 'self_hosted')
        .in('status', ['scheduled', 'published']);
      if (liveErr) throw new Error(liveErr.message);

      const existingKey = new Set<string>(
        (liveRows ?? []).map((r) => `${r.content_id as string}::${r.language as string}`)
      );

      const rowsWithProject = input.rows.map((r) => ({
        ...r,
        projectId: input.projectId,
      }));

      const { toInsert, skipped } = computeBulkInsertRows(rowsWithProject, existingKey, uid);
      if (toInsert.length === 0) return { inserted: 0, skipped };

      const { data, error } = await supabase
        .from('mkt_publish_records')
        .insert(toInsert as unknown as Record<string, unknown>[])
        .select();
      if (error) throw new Error(error.message);

      return { inserted: data?.length ?? 0, skipped };
    },
    onSuccess: (_result, input) => {
      void queryClient.invalidateQueries({
        queryKey: mktKeys.publishRecords(input.projectId),
      });
      void queryClient.invalidateQueries({
        queryKey: mktKeys.publishCounts(input.projectId),
      });
    },
  });
}

/** Cancel (delete) a scheduled publish record. RLS scopes the delete; no stamp. */
export function useCancelPublish() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { recordId: string; projectId: string }) => {
      const { error } = await supabase
        .from('mkt_publish_records')
        .delete()
        .eq('id', input.recordId);
      if (error) throw new Error(error.message);
      return input;
    },
    onSuccess: ({ projectId }) => {
      void queryClient.invalidateQueries({
        queryKey: mktKeys.publishRecords(projectId),
      });
      void queryClient.invalidateQueries({
        queryKey: mktKeys.publishCounts(projectId),
      });
    },
  });
}

/** Update the scheduled_at timestamp for an existing record. Owned-row update; no stamp. */
export function useUpdateScheduledAt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string; projectId: string; scheduledAt: string }) => {
      const { error } = await supabase
        .from('mkt_publish_records')
        .update({ scheduled_at: input.scheduledAt })
        .eq('id', input.id);
      if (error) throw new Error(error.message);
      return input;
    },
    onSuccess: ({ projectId }) => {
      void queryClient.invalidateQueries({
        queryKey: mktKeys.publishRecords(projectId),
      });
      void queryClient.invalidateQueries({
        queryKey: mktKeys.publishCounts(projectId),
      });
    },
  });
}
