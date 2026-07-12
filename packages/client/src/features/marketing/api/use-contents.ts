import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { mktKeys, fetchContents, fetchContentGraph } from './queries';
import { generateId } from '../lib/utils';
import type { Content, ContentKind } from '../types/database';

export function useUpdateContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      projectId,
      updates,
    }: {
      id: string;
      projectId: string;
      updates: Partial<Content>;
    }) => {
      const updatedData = { ...updates, updated_at: new Date().toISOString() };
      const { error } = await supabase
        .from('mkt_contents')
        .update(updatedData as unknown as Record<string, unknown>)
        .eq('id', id);
      if (error) throw new Error(error.message);
      return { id, projectId };
    },
    onSuccess: ({ id, projectId }) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.content(id) });
      queryClient.invalidateQueries({ queryKey: mktKeys.contents(projectId) });
    },
  });
}

// ─── Read Queries ─────────────────────────────────────────────────────────────

export function useContents(projectId: string | null) {
  return useQuery({
    queryKey: mktKeys.contents(projectId ?? ''),
    queryFn: () => fetchContents(projectId!),
    enabled: Boolean(projectId),
  });
}

export function useContent(id: string | null) {
  return useQuery({
    queryKey: mktKeys.content(id ?? ''),
    queryFn: () => fetchContentGraph(id!),
    enabled: Boolean(id),
  });
}

// ─── Mutations ─────────────────────────────────────────────────────────────────

export function useCreateContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      project_id: string;
      title: string;
      category?: string;
      tags?: string[];
      topic?: string;
      content_kind?: ContentKind;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('인증이 필요합니다');

      // Determine sort_order from existing cached contents
      const existing = queryClient.getQueryData<Content[]>(mktKeys.contents(data.project_id));
      const sortOrder = existing?.length ?? 0;

      const now = new Date().toISOString();
      const newContent: Content = {
        id: generateId(),
        project_id: data.project_id,
        user_id: user.id,
        title: data.title,
        category: data.category ?? null,
        tags: data.tags ?? null,
        memo: null,
        topic: data.topic ?? null,
        content_kind: data.content_kind ?? 'regular',
        status: 'draft',
        confirmed: false,
        ai_model_settings: null,
        sort_order: sortOrder,
        created_at: now,
        updated_at: now,
      };

      const { error } = await supabase
        .from('mkt_contents')
        .insert(newContent as unknown as Record<string, unknown>);
      if (error) throw new Error(error.message);
      return newContent;
    },
    onSuccess: (newContent) => {
      queryClient.invalidateQueries({
        queryKey: mktKeys.contents(newContent.project_id),
      });
    },
  });
}

export function useDeleteContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      // Cascade delete is handled by Supabase FK rules on mkt_* tables
      const { error } = await supabase.from('mkt_contents').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return { id, projectId };
    },
    onSuccess: ({ id, projectId }) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.contents(projectId) });
      queryClient.removeQueries({ queryKey: mktKeys.content(id) });
    },
  });
}

export function useReorderContents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, contentIds }: { projectId: string; contentIds: string[] }) => {
      // Fire all sort_order updates in parallel
      const updates = contentIds.map((id, i) =>
        supabase
          .from('mkt_contents')
          .update({ sort_order: i } as Record<string, unknown>)
          .eq('id', id)
      );
      const results = await Promise.all(updates);
      const failed = results.find((r) => r.error);
      if (failed?.error) throw new Error(failed.error.message);
      return { projectId, contentIds };
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.contents(projectId) });
    },
  });
}
