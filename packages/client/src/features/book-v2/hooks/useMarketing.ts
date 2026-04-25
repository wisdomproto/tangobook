import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bookV2Api } from '../api/book-v2.api';
import type { BlogPostV2, CardNewsProjectV2 } from '@tangobook/shared';

// ── Blog ──────────────────────────────────────────────────────────────

export function useBlogList(bid: string, language?: string) {
  return useQuery({
    queryKey: ['book-v2', 'marketing', 'blog', bid, language ?? null],
    queryFn: () => bookV2Api.listBlogs(bid, language),
    enabled: !!bid,
  });
}

export function useBlogPost(bid: string, postId: string | null) {
  return useQuery({
    queryKey: ['book-v2', 'marketing', 'blog', bid, 'post', postId],
    queryFn: () => bookV2Api.getBlog(bid, postId!),
    enabled: !!bid && !!postId,
  });
}

export function useCreateBlog(bid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { language: string; title?: string }) => bookV2Api.createBlog(bid, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['book-v2', 'marketing', 'blog', bid] });
    },
  });
}

export function useSaveBlog(bid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, patch }: { postId: string; patch: Partial<BlogPostV2> }) =>
      bookV2Api.saveBlog(bid, postId, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['book-v2', 'marketing', 'blog', bid] });
    },
  });
}

export function useDeleteBlog(bid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => bookV2Api.deleteBlog(bid, postId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['book-v2', 'marketing', 'blog', bid] });
    },
  });
}

// ── Card News ─────────────────────────────────────────────────────────

export function useCardNewsList(bid: string, language?: string) {
  return useQuery({
    queryKey: ['book-v2', 'marketing', 'card-news', bid, language ?? null],
    queryFn: () => bookV2Api.listCardNews(bid, language),
    enabled: !!bid,
  });
}

export function useCardNewsProject(bid: string, projectId: string | null) {
  return useQuery({
    queryKey: ['book-v2', 'marketing', 'card-news', bid, 'project', projectId],
    queryFn: () => bookV2Api.getCardNews(bid, projectId!),
    enabled: !!bid && !!projectId,
  });
}

export function useCreateCardNews(bid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { language: string; title?: string }) => bookV2Api.createCardNews(bid, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['book-v2', 'marketing', 'card-news', bid] });
    },
  });
}

export function useSaveCardNews(bid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, patch }: { projectId: string; patch: Partial<CardNewsProjectV2> }) =>
      bookV2Api.saveCardNews(bid, projectId, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['book-v2', 'marketing', 'card-news', bid] });
    },
  });
}

export function useDeleteCardNews(bid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) => bookV2Api.deleteCardNews(bid, projectId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['book-v2', 'marketing', 'card-news', bid] });
    },
  });
}
