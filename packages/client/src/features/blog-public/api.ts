// 공개 블로그(발행된 self_hosted 내부 블로그) 조회 훅.
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/axios';

export interface BlogPostSummary {
  slug: string;
  title: string;
  description: string;
  category: string | null;
  publishedAt: string | null;
  thumbnail: string | null;
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

const langQuery = (lang: string) => (lang && lang !== 'ko' ? `?lang=${lang}` : '');

export function useBlogPosts(lang = 'ko') {
  return useQuery({
    queryKey: ['blog', 'list', lang],
    queryFn: () => apiGet<BlogPostSummary[]>(`/blog${langQuery(lang)}`),
    staleTime: 5 * 60 * 1000,
  });
}

export function useBlogPost(slug: string, lang = 'ko') {
  return useQuery({
    queryKey: ['blog', 'post', slug, lang],
    enabled: !!slug,
    queryFn: () => apiGet<BlogPostDetail>(`/blog/${encodeURIComponent(slug)}${langQuery(lang)}`),
  });
}
