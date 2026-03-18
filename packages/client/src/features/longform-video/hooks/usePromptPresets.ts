import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { presetApi } from '../api/longform.api';
import type { PromptPreset } from '@tangobook/shared';

const QUERY_KEY = ['prompt-presets'] as const;

export function usePresetList() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => presetApi.list(),
  });
}

export function useCreatePreset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; systemPrompt: string }) => presetApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useUpdatePreset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PromptPreset> }) =>
      presetApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useDeletePreset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => presetApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
