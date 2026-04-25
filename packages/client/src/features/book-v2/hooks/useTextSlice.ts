import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bookV2Api } from '../api/book-v2.api';
import type { BookTextSlice, ReadingLevel } from '@tangobook/shared';

export function useTextSlice(bid: string, level: ReadingLevel | null, language: string) {
  return useQuery({
    queryKey: ['book-v2', 'text', bid, level, language],
    queryFn: () => bookV2Api.getTextSlice(bid, level!, language),
    enabled: !!bid && !!level && !!language,
    retry: (failureCount, err) => {
      // 404는 retry 안 함 (slice 없음 — 신규 생성 케이스)
      const msg = (err as Error)?.message ?? '';
      if (msg.includes('404') || msg.includes('not found')) return false;
      return failureCount < 2;
    },
  });
}

export function useSaveTextSlice(bid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      level,
      language,
      slice,
    }: {
      level: ReadingLevel;
      language: string;
      slice: BookTextSlice;
    }) => bookV2Api.saveTextSlice(bid, level, language, slice),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['book-v2', 'text', bid, vars.level, vars.language] });
      qc.invalidateQueries({ queryKey: ['book-v2', 'manifest', bid] });
      qc.invalidateQueries({ queryKey: ['book-v2', 'index'] });
    },
  });
}
