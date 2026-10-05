import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookVideoApi } from '../api/book-video.api';
import type { BookVideoFormat, BookVideoProduction } from '@tangobook/shared';

export function useBookVideos(bookId: string) {
  return useQuery({ queryKey: ['book-videos', bookId], queryFn: () => bookVideoApi.get(bookId) });
}
export function useSaveBookVideos(bookId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      revision: number;
      productions: Record<BookVideoFormat, BookVideoProduction>;
    }) => bookVideoApi.save(bookId, input.revision, input.productions),
    onSuccess: (library) => client.setQueryData(['book-videos', bookId], library),
  });
}
export function useRegisterBookVideos(bookId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (versionId: string) => bookVideoApi.register(bookId, versionId),
    onSuccess: () => client.invalidateQueries({ queryKey: ['mkt'] }),
  });
}
