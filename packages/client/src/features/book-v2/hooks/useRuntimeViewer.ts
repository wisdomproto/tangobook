import { useQuery } from '@tanstack/react-query';
import { bookV2Api } from '../api/book-v2.api';
import type { ReadingLevel } from '@tangobook/shared';

interface ViewerRuntimeFilter {
  level: ReadingLevel;
  language: string;
  style: string;
}

export function useRuntimeViewer(bid: string, filter: ViewerRuntimeFilter | null) {
  return useQuery({
    queryKey: ['book-v2', 'runtime-viewer', bid, filter?.level, filter?.language, filter?.style],
    queryFn: () => bookV2Api.getRuntimeViewer(bid, filter!.level, filter!.language, filter!.style),
    enabled: !!bid && !!filter,
  });
}
