import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { BookGroupsDoc } from '@tangobook/shared';
import { bookGroupsApi } from '../api/book-groups.api';

const KEY = ['book-groups'] as const;

export function useBookGroups() {
  return useQuery({ queryKey: KEY, queryFn: bookGroupsApi.get, staleTime: 60_000 });
}

export function useSaveBookGroups() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (doc: BookGroupsDoc) => bookGroupsApi.put(doc),
    onSuccess: (data) => qc.setQueryData(KEY, data),
  });
}
