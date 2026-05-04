import { useQuery } from '@tanstack/react-query';
import { collectionApi } from '../api/collection.api';

export function useCollectionCatalog() {
  return useQuery({
    queryKey: ['collection', 'catalog'],
    queryFn: async () => {
      const data = await collectionApi.getCatalog();
      // 같은 카드 id 중복 entry 제거 — `Encountered two children with the same key word-cow` 등
      // React duplicate key 경고 임시 해소. 근본은 server sync 로직 점검 필요 (TODO).
      const seen = new Set<string>();
      const items = (data?.items ?? []).filter((it) => {
        if (seen.has(it.id)) return false;
        seen.add(it.id);
        return true;
      });
      return { ...data, items };
    },
    staleTime: 5 * 60_000,
  });
}

export function useStorybookCardIndex() {
  return useQuery({
    queryKey: ['collection', 'storybook-index'],
    queryFn: collectionApi.getStorybookIndex,
    staleTime: 5 * 60_000,
  });
}
