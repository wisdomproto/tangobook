import { useQuery } from '@tanstack/react-query';
import { supabase } from './supabase';

/**
 * 네이버 블로그 발행 이력 (`mkt_naver_blog_publications`).
 *
 * 발행기(`.worktrees/naver-blog`)가 쓰고, 여기서는 읽기만 한다.
 * 🔴 `book_id` 는 **`mkt_contents.id`** 다 — 책 R2 id 가 아니다(이름이 헷갈린다).
 */
export interface NaverPublication {
  book_id: string;
  post_id: string;
  language: string;
  status: 'draft' | 'published' | 'failed';
  naver_post_url: string | null;
  published_at: string | null;
  error_message: string | null;
  updated_at: string | null;
}

export function useNaverPublication(contentId: string | null) {
  return useQuery({
    queryKey: ['mkt', 'naver-publication', contentId] as const,
    enabled: !!contentId,
    queryFn: async (): Promise<NaverPublication | null> => {
      const { data, error } = await supabase
        .from('mkt_naver_blog_publications')
        .select(
          'book_id, post_id, language, status, naver_post_url, published_at, error_message, updated_at'
        )
        .eq('book_id', contentId!)
        .eq('language', 'ko')
        .maybeSingle();
      if (error) throw new Error(error.message);
      return (data as NaverPublication) ?? null;
    },
  });
}
