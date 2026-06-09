import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { mktKeys } from './queries';
import { generateId } from '../lib/utils';
import type { BaseArticle } from '../types/database';

export function useUpsertBaseArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ contentId, data }: { contentId: string; data: Partial<BaseArticle> }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('인증이 필요합니다');

      const { data: existing, error: selErr } = await supabase
        .from('mkt_base_articles')
        .select('id')
        .eq('content_id', contentId)
        .maybeSingle();
      if (selErr) throw new Error(selErr.message);

      const now = new Date().toISOString();
      if (!existing) {
        const row = {
          id: generateId(),
          user_id: user.id,
          content_id: contentId,
          title: null,
          body: '',
          body_plain_text: null,
          word_count: 0,
          factcheck_status: null,
          factcheck_score: null,
          factcheck_report: null,
          prompt_used: null,
          created_at: now,
          updated_at: now,
          ...data,
        };
        const { error } = await supabase
          .from('mkt_base_articles')
          .insert(row as unknown as Record<string, unknown>);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase
          .from('mkt_base_articles')
          .update({ ...data, updated_at: now } as unknown as Record<string, unknown>)
          .eq('content_id', contentId);
        if (error) throw new Error(error.message);
      }
      return { contentId };
    },
    onSuccess: ({ contentId }) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.content(contentId) });
    },
  });
}
