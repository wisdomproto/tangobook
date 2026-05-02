import { useQuery } from '@tanstack/react-query';
import { bookV2Api } from '../api/book-v2.api';

/** 라이브러리 인덱스 (모든 책의 manifest 요약) */
export function useBookIndex() {
  return useQuery({
    queryKey: ['book-v2', 'index'],
    queryFn: bookV2Api.listIndex,
  });
}

export function useBookManifest(bid: string | undefined) {
  return useQuery({
    queryKey: ['book-v2', 'manifest', bid],
    queryFn: () => bookV2Api.getManifest(bid!),
    enabled: !!bid,
    // 137권은 v2 manifest 가 없어서 404. retry 없이 한 번만 시도.
    retry: false,
  });
}
