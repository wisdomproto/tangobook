import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bookV2Api, type UpdateBookMetaPatch, type VariantPatch } from '../api/book-v2.api';
import type { StorybookType } from '@tangobook/shared';

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

export function useCreateBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      title: string;
      type?: StorybookType;
      category?: string;
      folder?: string;
      isPublic?: boolean;
    }) => bookV2Api.createBook(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['book-v2', 'index'] });
    },
  });
}

export function useDeleteBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bid: string) => bookV2Api.deleteBook(bid),
    onSuccess: () => {
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
