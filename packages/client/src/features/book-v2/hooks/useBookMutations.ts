import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bookV2Api, type UpdateBookMetaPatch, type VariantPatch } from '../api/book-v2.api';

export function useUpdateBookMeta(bid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: UpdateBookMetaPatch) => bookV2Api.updateMeta(bid, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['book-v2', 'manifest', bid] });
      qc.invalidateQueries({ queryKey: ['book-v2', 'index'] });
    },
  });
}

export function usePatchVariants(bid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: VariantPatch) => bookV2Api.patchVariants(bid, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['book-v2', 'manifest', bid] });
      qc.invalidateQueries({ queryKey: ['book-v2', 'index'] });
    },
  });
}
