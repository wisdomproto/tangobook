import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { mktKeys } from './queries';
import { generateId } from '../lib/utils';
import type { BlogContent, BlogCard } from '../types/database';

async function getUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('인증이 필요합니다');
  return user.id;
}

export function useCreateBlogContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      contentId,
      channel,
      data,
    }: {
      contentId: string;
      channel: 'naver_blog' | 'self_hosted';
      data?: Partial<BlogContent>;
    }): Promise<string> => {
      const userId = await getUserId();
      const id = generateId();
      const now = new Date().toISOString();
      const row = {
        id,
        user_id: userId,
        content_id: contentId,
        channel,
        title: null,
        seo_title: null,
        seo_score: null,
        seo_details: null,
        naver_keywords: null,
        meta_description: null,
        url_slug: null,
        primary_keyword: null,
        secondary_keywords: null,
        search_intent: null,
        heading_structure: null,
        status: 'draft',
        published_url: null,
        published_at: null,
        created_at: now,
        updated_at: now,
        ...data,
      };
      const { error } = await supabase
        .from('mkt_blog_contents')
        .insert(row as unknown as Record<string, unknown>);
      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: (_id, { contentId }) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.content(contentId) });
    },
  });
}

export function useUpdateBlogContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      contentId: _contentId,
      updates,
    }: {
      id: string;
      contentId: string;
      updates: Partial<BlogContent>;
    }) => {
      const { error } = await supabase
        .from('mkt_blog_contents')
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

export function useDeleteBlogContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, contentId: _c }: { id: string; contentId: string }) => {
      // FK cascade removes the cards
      const { error } = await supabase.from('mkt_blog_contents').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_v, { contentId }) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.content(contentId) });
    },
  });
}

export function useSetBlogCards() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      blogContentId,
      contentId: _c,
      cards,
    }: {
      blogContentId: string;
      contentId: string;
      cards: BlogCard[];
    }) => {
      const { error: delErr } = await supabase
        .from('mkt_blog_cards')
        .delete()
        .eq('blog_content_id', blogContentId);
      if (delErr) throw new Error(delErr.message);
      if (cards.length > 0) {
        const { error: insErr } = await supabase
          .from('mkt_blog_cards')
          .insert(cards as unknown as Record<string, unknown>[]);
        if (insErr) throw new Error(insErr.message);
      }
    },
    onSuccess: (_v, { contentId }) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.content(contentId) });
    },
  });
}

export function useAddBlogCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      blogContentId,
      contentId: _c,
      cardType,
      sortOrder,
    }: {
      blogContentId: string;
      contentId: string;
      cardType: BlogCard['card_type'];
      sortOrder: number;
    }): Promise<string> => {
      const userId = await getUserId();
      const id = generateId();
      const now = new Date().toISOString();
      const row = {
        id,
        user_id: userId,
        blog_content_id: blogContentId,
        card_type: cardType,
        content: {},
        sort_order: sortOrder,
        created_at: now,
        updated_at: now,
      };
      const { error } = await supabase
        .from('mkt_blog_cards')
        .insert(row as unknown as Record<string, unknown>);
      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: (_id, { contentId }) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.content(contentId) });
    },
  });
}

export function useUpdateBlogCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      cardId,
      contentId: _c,
      updates,
    }: {
      cardId: string;
      contentId: string;
      updates: Partial<BlogCard>;
    }) => {
      const { error } = await supabase
        .from('mkt_blog_cards')
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

export function useDeleteBlogCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ cardId, contentId: _c }: { cardId: string; contentId: string }) => {
      const { error } = await supabase.from('mkt_blog_cards').delete().eq('id', cardId);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_v, { contentId }) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.content(contentId) });
    },
  });
}

export function useReorderBlogCards() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      blogContentId: _b,
      contentId: _c,
      cardIds,
    }: {
      blogContentId: string;
      contentId: string;
      cardIds: string[];
    }) => {
      const results = await Promise.all(
        cardIds.map((id, i) =>
          supabase
            .from('mkt_blog_cards')
            .update({ sort_order: i } as Record<string, unknown>)
            .eq('id', id)
        )
      );
      const failed = results.find((r) => r.error);
      if (failed?.error) throw new Error(failed.error.message);
    },
    onSuccess: (_v, { contentId }) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.content(contentId) });
    },
  });
}
