import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { mktKeys } from './queries';
import { generateId } from '../lib/utils';
import type { CardTemplateRow } from '../types/database';

async function getUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('인증이 필요합니다');
  return user.id;
}

export function useCardTemplates(projectId: string | null) {
  return useQuery({
    queryKey: mktKeys.cardTemplates(projectId ?? ''),
    queryFn: async (): Promise<CardTemplateRow[]> => {
      const { data, error } = await supabase
        .from('mkt_card_templates')
        .select('*')
        .eq('project_id', projectId!)
        .order('created_at');
      if (error) throw new Error(error.message);
      return (data ?? []) as CardTemplateRow[];
    },
    enabled: Boolean(projectId),
  });
}

export function useHiddenBuiltins(projectId: string | null) {
  return useQuery({
    queryKey: mktKeys.cardHiddenBuiltins(projectId ?? ''),
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from('mkt_card_hidden_builtins')
        .select('builtin_id')
        .eq('project_id', projectId!);
      if (error) throw new Error(error.message);
      return (data ?? []).map((r) => (r as { builtin_id: string }).builtin_id);
    },
    enabled: Boolean(projectId),
  });
}

export function useCreateCardTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      data,
    }: {
      projectId: string;
      data: Omit<CardTemplateRow, 'id' | 'user_id' | 'project_id' | 'created_at' | 'updated_at'>;
    }): Promise<string> => {
      const userId = await getUserId();
      const id = generateId();
      const now = new Date().toISOString();
      const row = {
        id,
        user_id: userId,
        project_id: projectId,
        created_at: now,
        updated_at: now,
        ...data,
      };
      const { error } = await supabase
        .from('mkt_card_templates')
        .insert(row as unknown as Record<string, unknown>);
      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: (_id, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.cardTemplates(projectId) });
    },
  });
}

export function useUpdateCardTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      projectId: _p,
      updates,
    }: {
      id: string;
      projectId: string;
      updates: Partial<CardTemplateRow>;
    }) => {
      const { error } = await supabase
        .from('mkt_card_templates')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        } as unknown as Record<string, unknown>)
        .eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_v, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.cardTemplates(projectId) });
    },
  });
}

export function useDeleteCardTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, projectId: _p }: { id: string; projectId: string }) => {
      const { error } = await supabase.from('mkt_card_templates').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_v, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.cardTemplates(projectId) });
    },
  });
}

export function useHideBuiltin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, builtinId }: { projectId: string; builtinId: string }) => {
      const userId = await getUserId();
      const now = new Date().toISOString();
      const row = {
        id: generateId(),
        user_id: userId,
        project_id: projectId,
        builtin_id: builtinId,
        hidden_at: now,
      };
      // unique (project_id, builtin_id) — ignore duplicate insert conflicts
      const { error } = await supabase
        .from('mkt_card_hidden_builtins')
        .insert(row as unknown as Record<string, unknown>);
      if (error && !/duplicate|unique/i.test(error.message)) throw new Error(error.message);
    },
    onSuccess: (_v, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.cardHiddenBuiltins(projectId) });
    },
  });
}
