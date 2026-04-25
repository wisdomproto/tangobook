import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bookV2Api } from '../api/book-v2.api';
import type { BookCharacter, ReadingLevel } from '@tangobook/shared';

export function useStyleSlice(bid: string, style: string | null) {
  return useQuery({
    queryKey: ['book-v2', 'style', bid, style],
    queryFn: () => bookV2Api.getStyleSlice(bid, style!),
    enabled: !!bid && !!style,
    retry: (failureCount, err) => {
      const msg = (err as Error)?.message ?? '';
      if (msg.includes('404') || msg.includes('not found')) return false;
      return failureCount < 2;
    },
  });
}

function invalidateAll(qc: ReturnType<typeof useQueryClient>, bid: string, style: string) {
  qc.invalidateQueries({ queryKey: ['book-v2', 'style', bid, style] });
  qc.invalidateQueries({ queryKey: ['book-v2', 'manifest', bid] });
  qc.invalidateQueries({ queryKey: ['book-v2', 'index'] });
}

export function useSaveCharacters(bid: string, style: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (characters: BookCharacter[]) => bookV2Api.saveCharacters(bid, style, characters),
    onSuccess: () => invalidateAll(qc, bid, style),
  });
}

export function useUploadCover(bid: string, style: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => bookV2Api.uploadCover(bid, style, file),
    onSuccess: () => invalidateAll(qc, bid, style),
  });
}

export function useUploadKeyObjectImage(bid: string, style: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ refId, file }: { refId: string; file: File }) =>
      bookV2Api.uploadKeyObjectImage(bid, style, refId, file),
    onSuccess: () => invalidateAll(qc, bid, style),
  });
}

export function useUploadVocabImage(bid: string, style: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ refId, file }: { refId: string; file: File }) =>
      bookV2Api.uploadVocabImage(bid, style, refId, file),
    onSuccess: () => invalidateAll(qc, bid, style),
  });
}

export function useUploadPageImage(bid: string, style: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      level,
      illustrationKey,
      file,
    }: {
      level: ReadingLevel;
      illustrationKey: string;
      file: File;
    }) => bookV2Api.uploadPageImage(bid, style, level, illustrationKey, file),
    onSuccess: () => invalidateAll(qc, bid, style),
  });
}
