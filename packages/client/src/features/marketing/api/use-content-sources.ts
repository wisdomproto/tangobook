import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { mktKeys } from './queries';
import { generateId } from '../lib/utils';
import type { Content, ContentSource } from '../types/database';

export function useContentSources(projectId: string | null) {
  return useQuery({
    queryKey: ['mkt', 'content-sources', projectId ?? ''],
    enabled: Boolean(projectId),
    queryFn: async (): Promise<ContentSource[]> => {
      const { data, error } = await supabase
        .from('mkt_content_sources')
        .select('*')
        .eq('project_id', projectId!)
        .eq('source_type', 'storybook')
        .order('title', { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as ContentSource[];
    },
  });
}

export function useCreateContentFromSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      source,
      sortOrder,
      title,
    }: {
      projectId: string;
      source: ContentSource;
      sortOrder: number;
      title: string;
    }): Promise<Content> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('인증이 필요합니다');
      const now = new Date().toISOString();
      const row: Content = {
        id: generateId(),
        project_id: projectId,
        user_id: user.id,
        title,
        category: source.category,
        tags: ['동화책'],
        memo: null,
        topic: source.title,
        content_kind: 'regular',
        content_source_id: source.id,
        status: 'draft',
        ai_model_settings: null,
        confirmed: false,
        sort_order: sortOrder,
        created_at: now,
        updated_at: now,
      };
      const { error } = await supabase
        .from('mkt_contents')
        .insert(row as unknown as Record<string, unknown>);
      if (error) throw new Error(error.message);
      return row;
    },
    onSuccess: (content) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.contents(content.project_id) });
    },
  });
}
