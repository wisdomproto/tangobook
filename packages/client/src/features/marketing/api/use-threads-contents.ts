import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { mktKeys } from './queries';
import { generateId } from '../lib/utils';
import type { ThreadsContent, ThreadsCard } from '../types/database';

async function getUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('인증이 필요합니다');
  return user.id;
}

export function useCreateThreadsContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      contentId,
      data,
    }: {
      contentId: string;
      data?: Partial<ThreadsContent>;
    }): Promise<string> => {
      const userId = await getUserId();
      const id = generateId();
      const now = new Date().toISOString();
      const row = {
        id,
        user_id: userId,
        content_id: contentId,
        title: null,
        thread_type: 'single',
        status: 'draft',
        published_url: null,
        published_at: null,
        created_at: now,
        updated_at: now,
        ...data,
      };
      const { error } = await supabase
        .from('mkt_threads_contents')
        .insert(row as unknown as Record<string, unknown>);
      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: (_id, { contentId }) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.content(contentId) });
    },
  });
}

export function useUpdateThreadsContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      contentId: _c,
      updates,
    }: {
      id: string;
      contentId: string;
      updates: Partial<ThreadsContent>;
    }) => {
      const { error } = await supabase
        .from('mkt_threads_contents')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        } as unknown as Record<string, unknown>)
        .eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_v, { contentId }) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.content(contentId) });
    },
  });
}

export function useDeleteThreadsContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, contentId: _c }: { id: string; contentId: string }) => {
      const { error } = await supabase.from('mkt_threads_contents').delete().eq('id', id);
      if (error) throw new Error(error.message); // FK cascade removes cards
    },
    onSuccess: (_v, { contentId }) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.content(contentId) });
    },
  });
}

export function useSetThreadsCards() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      threadsContentId,
      contentId: _c,
      cards,
    }: {
      threadsContentId: string;
      contentId: string;
      cards: ThreadsCard[];
    }) => {
      const { error: delErr } = await supabase
        .from('mkt_threads_cards')
        .delete()
        .eq('threads_content_id', threadsContentId);
      if (delErr) throw new Error(delErr.message);
      if (cards.length > 0) {
        const { error: insErr } = await supabase
          .from('mkt_threads_cards')
          .insert(cards as unknown as Record<string, unknown>[]);
        if (insErr) throw new Error(insErr.message);
      }
    },
    onSuccess: (_v, { contentId }) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.content(contentId) });
    },
  });
}

export function useAddThreadsCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      threadsContentId,
      contentId: _c,
      sortOrder,
    }: {
      threadsContentId: string;
      contentId: string;
      sortOrder: number;
    }): Promise<string> => {
      const userId = await getUserId();
      const id = generateId();
      const now = new Date().toISOString();
      // Note: media_type is used by threads to store the per-post image prompt (CF quirk).
      const row = {
        id,
        user_id: userId,
        threads_content_id: threadsContentId,
        text_content: '',
        media_url: null,
        media_type: null,
        sort_order: sortOrder,
        created_at: now,
        updated_at: now,
      };
      const { error } = await supabase
        .from('mkt_threads_cards')
        .insert(row as unknown as Record<string, unknown>);
      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: (_id, { contentId }) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.content(contentId) });
    },
  });
}

export function useUpdateThreadsCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      cardId,
      contentId: _c,
      updates,
    }: {
      cardId: string;
      contentId: string;
      updates: Partial<ThreadsCard>;
    }) => {
      const { error } = await supabase
        .from('mkt_threads_cards')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        } as unknown as Record<string, unknown>)
        .eq('id', cardId);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_v, { contentId }) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.content(contentId) });
    },
  });
}

export function useDeleteThreadsCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ cardId, contentId: _c }: { cardId: string; contentId: string }) => {
      const { error } = await supabase.from('mkt_threads_cards').delete().eq('id', cardId);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_v, { contentId }) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.content(contentId) });
    },
  });
}
