import { useMutation, useQueryClient } from '@tanstack/react-query';
import { storybookApi } from '../api/storybook.api';
import type {
  Storybook,
  GenerateStorybookRequest,
  GenerateStoryRequest,
  GeneratePhonicsBookRequest,
} from '@tangobook/shared';

export function useSaveStorybook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (storybook: Storybook) => storybookApi.save(storybook),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['storybooks'] });
      qc.setQueryData(['storybook', data.id], data);
    },
  });
}

/** Fetch full storybook → apply partial update → save */
export function usePatchStorybook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Storybook> }) => {
      const full = await storybookApi.getById(id);
      return storybookApi.save({ ...full, ...patch });
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['storybooks'] });
      qc.setQueryData(['storybook', data.id], data);
    },
  });
}

export function useCopyStorybook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => storybookApi.copy(id),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['storybooks'] });
      qc.setQueryData(['storybook', data.id], data);
    },
  });
}

export function useDeleteStorybook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => storybookApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['storybooks'] });
    },
  });
}

export function useGenerateStory() {
  return useMutation({
    mutationFn: (req: GenerateStoryRequest) => storybookApi.generateStory(req),
  });
}

export function useGenerateStorybook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: GenerateStorybookRequest) => storybookApi.generate(req),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['storybooks'] });
      qc.setQueryData(['storybook', data.id], data);
    },
  });
}

export function useGeneratePhonicsBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: GeneratePhonicsBookRequest) => storybookApi.generatePhonicsBook(req),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['storybooks'] });
      qc.setQueryData(['storybook', data.id], data);
    },
  });
}
