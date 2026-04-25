import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bookV2Api } from '../api/book-v2.api';
import type { AudiobookProjectV2 } from '@tangobook/shared';

export function useAudiobookProject(bid: string) {
  return useQuery({
    queryKey: ['book-v2', 'audiobook', bid],
    queryFn: () => bookV2Api.getAudiobookProject(bid),
    enabled: !!bid,
  });
}

export function useSaveAudiobookProject(bid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (project: AudiobookProjectV2) => bookV2Api.saveAudiobookProject(bid, project),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['book-v2', 'audiobook', bid] });
    },
  });
}

export function useAudiobookRenders(bid: string) {
  return useQuery({
    queryKey: ['book-v2', 'audiobook', bid, 'renders'],
    queryFn: () => bookV2Api.listAudiobookRenders(bid),
    enabled: !!bid,
  });
}
