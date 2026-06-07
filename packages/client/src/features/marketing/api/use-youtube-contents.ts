import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { mktKeys } from './queries';
import { generateId } from '../lib/utils';
import type { YoutubeContent, YoutubeCard } from '../types/database';

async function getUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('인증이 필요합니다');
  return user.id;
}

export function useCreateYoutubeContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      contentId,
      data,
    }: {
      contentId: string;
      data?: Partial<YoutubeContent>;
    }): Promise<string> => {
      const userId = await getUserId();
      const id = generateId();
      const now = new Date().toISOString();
      const row = {
        id,
        user_id: userId,
        content_id: contentId,
        title: null,
        video_title: null,
        video_description: null,
        video_tags: null,
        video_category: null,
        target_duration: 'mid', // CF UI default (?? 'mid'); stable select value
        thumbnail_url: null,
        video_url: null,
        status: 'draft',
        youtube_video_id: null,
        published_at: null,
        created_at: now,
        updated_at: now,
        ...data,
      };
      const { error } = await supabase
        .from('mkt_youtube_contents')
        .insert(row as unknown as Record<string, unknown>);
      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: (_id, { contentId }) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.content(contentId) });
    },
  });
}

export function useUpdateYoutubeContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      contentId: _c,
      updates,
    }: {
      id: string;
      contentId: string;
      updates: Partial<YoutubeContent>;
    }) => {
      const { error } = await supabase
        .from('mkt_youtube_contents')
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

export function useDeleteYoutubeContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, contentId: _c }: { id: string; contentId: string }) => {
      const { error } = await supabase.from('mkt_youtube_contents').delete().eq('id', id);
      if (error) throw new Error(error.message); // FK cascade removes cards
    },
    onSuccess: (_v, { contentId }) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.content(contentId) });
    },
  });
}

export function useSetYoutubeCards() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      youtubeContentId,
      contentId: _c,
      cards,
    }: {
      youtubeContentId: string;
      contentId: string;
      cards: YoutubeCard[]; // caller-supplied rows ALREADY carry user_id (R-A — panel stamps them)
    }) => {
      const { error: delErr } = await supabase
        .from('mkt_youtube_cards')
        .delete()
        .eq('youtube_content_id', youtubeContentId);
      if (delErr) throw new Error(delErr.message);
      if (cards.length > 0) {
        const { error: insErr } = await supabase
          .from('mkt_youtube_cards')
          .insert(cards as unknown as Record<string, unknown>[]);
        if (insErr) throw new Error(insErr.message);
      }
    },
    onSuccess: (_v, { contentId }) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.content(contentId) });
    },
  });
}

export function useAddYoutubeCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      youtubeContentId,
      contentId: _c,
      sortOrder,
    }: {
      youtubeContentId: string;
      contentId: string;
      sortOrder: number;
    }): Promise<string> => {
      const userId = await getUserId();
      const id = generateId();
      const now = new Date().toISOString();
      const row = {
        id,
        user_id: userId,
        youtube_content_id: youtubeContentId,
        section_type: 'main',
        narration_text: '',
        screen_direction: '',
        subtitle_text: null,
        image_url: null,
        image_prompt: null,
        video_prompt: null,
        sort_order: sortOrder,
        created_at: now,
        updated_at: now,
      };
      const { error } = await supabase
        .from('mkt_youtube_cards')
        .insert(row as unknown as Record<string, unknown>);
      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: (_id, { contentId }) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.content(contentId) });
    },
  });
}

export function useUpdateYoutubeCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      cardId,
      contentId: _c,
      updates,
    }: {
      cardId: string;
      contentId: string;
      updates: Partial<YoutubeCard>;
    }) => {
      const { error } = await supabase
        .from('mkt_youtube_cards')
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

export function useDeleteYoutubeCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ cardId, contentId: _c }: { cardId: string; contentId: string }) => {
      const { error } = await supabase.from('mkt_youtube_cards').delete().eq('id', cardId);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_v, { contentId }) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.content(contentId) });
    },
  });
}
