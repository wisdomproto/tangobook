import { useQuery } from '@tanstack/react-query';

/**
 * 동화책 요약 목록(메인 앱 API, 동일 오리진 `GET /api/storybooks`)을 1회 조회해
 * `id → { title, coverImage }` 매핑을 만든다. GA4 분석의 "동화책별 인기" 패널이
 * 책 id 로 실제 제목·표지를 보강하는 용도(GA4 pageTitle 보다 깔끔·정확).
 *
 * 정적 데이터에 가까우므로 staleTime 을 길게 둔다.
 */
export interface StorybookLookupEntry {
  title: string;
  coverImage?: string;
}

export function useStorybookSummaries(enabled = true) {
  return useQuery({
    queryKey: ['mkt', 'storybook-summaries'],
    enabled,
    staleTime: 30 * 60 * 1000,
    queryFn: async (): Promise<Map<string, StorybookLookupEntry>> => {
      const res = await fetch('/api/storybooks');
      if (!res.ok) throw new Error(`storybooks ${res.status}`);
      const json = (await res.json()) as {
        data?: { id: string; title?: string; coverImage?: string }[];
      };
      const map = new Map<string, StorybookLookupEntry>();
      for (const s of json.data ?? []) {
        if (!s?.id) continue;
        map.set(s.id, {
          title: s.title ?? '',
          coverImage: s.coverImage ? encodeURI(s.coverImage) : undefined,
        });
      }
      return map;
    },
  });
}
