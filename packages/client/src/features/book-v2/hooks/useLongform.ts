import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bookV2Api } from '../api/book-v2.api';
import type { LongformProjectV2, ReadingLevel } from '@tangobook/shared';

interface LongformFilter {
  level: ReadingLevel;
  language: string;
  style: string;
}

export function useLongformList(bid: string, filter: LongformFilter | null) {
  return useQuery({
    queryKey: ['book-v2', 'longform', bid, filter?.level, filter?.language, filter?.style],
    queryFn: () => bookV2Api.listLongform(bid, filter!),
    enabled: !!bid && !!filter,
  });
}

export function useLongformProject(bid: string, projectId: string | null) {
  return useQuery({
    queryKey: ['book-v2', 'longform', bid, 'project', projectId],
    queryFn: () => bookV2Api.getLongform(bid, projectId!),
    enabled: !!bid && !!projectId,
  });
}

export function useCreateLongform(bid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      level: ReadingLevel;
      language: string;
      style: string;
      parentProjectId?: string;
    }) => bookV2Api.createLongform(bid, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['book-v2', 'longform', bid] });
    },
  });
}

export function useSaveLongform(bid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, patch }: { projectId: string; patch: Partial<LongformProjectV2> }) =>
      bookV2Api.saveLongform(bid, projectId, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['book-v2', 'longform', bid] });
    },
  });
}

export function useDeleteLongform(bid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) => bookV2Api.deleteLongform(bid, projectId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['book-v2', 'longform', bid] });
    },
  });
}
