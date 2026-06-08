import { useMutation } from '@tanstack/react-query';
import type { KeywordItem } from '../lib/keyword-sort';

export interface KeywordGroup {
  category: string;
  keywords: KeywordItem[];
}
export interface RecommendResult {
  groups: KeywordGroup[];
  strategy: string;
}
export interface RecommendBody {
  project: {
    name: string;
    industry?: string;
    brand_name?: string;
    brand_description?: string;
  };
  seedKeyword?: string;
}

export function useDiscoverGoldenKeywords() {
  return useMutation({
    mutationFn: async (body: RecommendBody): Promise<RecommendResult> => {
      const res = await fetch('/api/mkt/keywords/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        data?: RecommendResult;
        error?: string;
      };
      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.error || `황금 키워드 분석 실패 (HTTP ${res.status})`);
      }
      return json.data;
    },
  });
}
