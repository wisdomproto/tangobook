// 공개 블로그(발행된 self_hosted 내부 블로그) 조회 훅.
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/axios';

export interface BlogPostSummary {
  slug: string;
  title: string;
  description: string;
  category: string | null;
  publishedAt: string | null;
}

export interface BlogCardData {
  type: string; // text | image | divider | quote | list
  content: Record<string, unknown>;
}

export interface BlogPostDetail extends BlogPostSummary {
  cards: BlogCardData[];
  primaryKeyword: string | null;
  storybookId: string | null;
}

export function useBlogPosts() {
  return useQuery({
    queryKey: ['blog', 'list'],
    queryFn: () => apiGet<BlogPostSummary[]>('/blog'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useBlogPost(slug: string) {
  return useQuery({
    queryKey: ['blog', 'post', slug],
    enabled: !!slug,
    queryFn: () => apiGet<BlogPostDetail>(`/blog/${encodeURIComponent(slug)}`),
  });
}
