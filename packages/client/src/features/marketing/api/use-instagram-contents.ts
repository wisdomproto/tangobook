import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { mktKeys } from './queries';
import { generateId } from '../lib/utils';
import type { InstagramContent, InstagramCard } from '../types/database';

async function getUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('인증이 필요합니다');
  return user.id;
}

export function useCreateInstagramContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      contentId,
      data,
    }: {
      contentId: string;
      data?: Partial<InstagramContent>;
    }): Promise<string> => {
      const userId = await getUserId();
      const id = generateId();
      const now = new Date().toISOString();
      const row = {
        id,
        user_id: userId,
        content_id: contentId,
        title: null,
        caption: null,
        hashtags: null,
        content_type: 'carousel',
        video_settings: null,
        status: 'draft',
        published_url: null,
        published_at: null,
        created_at: now,
        updated_at: now,
        ...data,
      };
      const { error } = await supabase
        .from('mkt_instagram_contents')
        .insert(row as unknown as Record<string, unknown>);
      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: (_id, { contentId }) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.content(contentId) });
    },
  });
}

export function useUpdateInstagramContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      contentId: _c,
      updates,
    }: {
      id: string;
      contentId: string;
      updates: Partial<InstagramContent>;
    }) => {
      const { error } = await supabase
        .from('mkt_instagram_contents')
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

export function useDeleteInstagramContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, contentId: _c }: { id: string; contentId: string }) => {
      const { error } = await supabase.from('mkt_instagram_contents').delete().eq('id', id);
      if (error) throw new Error(error.message); // FK cascade removes cards
    },
    onSuccess: (_v, { contentId }) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.content(contentId) });
    },
  });
}

export function useSetInstagramCards() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      igContentId,
      contentId: _c,
      cards,
    }: {
      igContentId: string;
      contentId: string;
      cards: InstagramCard[];
    }) => {
      const { error: delErr } = await supabase
        .from('mkt_instagram_cards')
        .delete()
        .eq('instagram_content_id', igContentId);
      if (delErr) throw new Error(delErr.message);
      if (cards.length > 0) {
        const { error: insErr } = await supabase
          .from('mkt_instagram_cards')
          .insert(cards as unknown as Record<string, unknown>[]);
        if (insErr) throw new Error(insErr.message);
      }
    },
    onSuccess: (_v, { contentId }) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.content(contentId) });
    },
  });
}

export function useAddInstagramCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      igContentId,
      contentId: _c,
      sortOrder,
    }: {
      igContentId: string;
      contentId: string;
      sortOrder: number;
    }): Promise<string> => {
      const userId = await getUserId();
      const id = generateId();
      const now = new Date().toISOString();
      const row = {
        id,
        user_id: userId,
        instagram_content_id: igContentId,
        text_content: null,
        background_color: null,
        background_image_url: null,
        text_style: null,
        image_prompt: null,
        reference_image_url: null,
        sort_order: sortOrder,
        created_at: now,
        updated_at: now,
      };
      const { error } = await supabase
        .from('mkt_instagram_cards')
        .insert(row as unknown as Record<string, unknown>);
      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: (_id, { contentId }) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.content(contentId) });
    },
  });
}

export function useUpdateInstagramCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      cardId,
      contentId: _c,
      updates,
    }: {
      cardId: string;
      contentId: string;
      updates: Partial<InstagramCard>;
    }) => {
      const { error } = await supabase
        .from('mkt_instagram_cards')
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

export function useDeleteInstagramCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ cardId, contentId: _c }: { cardId: string; contentId: string }) => {
      const { error } = await supabase.from('mkt_instagram_cards').delete().eq('id', cardId);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_v, { contentId }) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.content(contentId) });
    },
  });
}
