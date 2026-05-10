import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { libraryConfigApi } from '../api/library-config.api';
import type { LibraryConfig } from '@tangobook/shared';

const KEY = ['library-config'] as const;

export function useLibraryConfig() {
  return useQuery({
    queryKey: KEY,
    queryFn: libraryConfigApi.get,
    staleTime: 60_000,
  });
}

export function useUpdateLibraryConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cfg: LibraryConfig) => libraryConfigApi.put(cfg),
    onSuccess: (data) => {
      qc.setQueryData(KEY, data);
    },
  });
}
