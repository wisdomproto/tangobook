import { useQuery } from '@tanstack/react-query';
import { collectionApi } from '../api/collection.api';

export function useCollectionCatalog() {
  return useQuery({
    queryKey: ['collection', 'catalog'],
    queryFn: collectionApi.getCatalog,
    staleTime: 5 * 60_000, // 카탈로그는 자주 안 바뀜
  });
}

export function useStorybookCardIndex() {
  return useQuery({
    queryKey: ['collection', 'storybook-index'],
    queryFn: collectionApi.getStorybookIndex,
    staleTime: 5 * 60_000,
  });
}
