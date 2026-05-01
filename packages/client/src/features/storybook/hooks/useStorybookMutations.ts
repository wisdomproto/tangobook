import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useRef, useCallback } from 'react';
import { storybookApi, type CopyProgress } from '../api/storybook.api';
import type {
  Storybook,
  GenerateStorybookRequest,
  GenerateStoryRequest,
  GeneratePhonicsBookRequest,
  ReadingLevel,
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

/**
 * Fire-and-forget 복사 + 진행률 polling.
 * `start(id)` 호출 → progress state 가 0% → 100% 까지 갱신 → onDone 콜백.
 * progress 가 null 이면 모달 숨김. 에러 발생 시 status='error'.
 */
export function useCopyStorybookAsync() {
  const qc = useQueryClient();
  const [progress, setProgress] = useState<CopyProgress | null>(null);
  const [sourceTitle, setSourceTitle] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = useCallback(() => {
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    stop();
    setProgress(null);
    setSourceTitle(null);
  }, [stop]);

  const start = useCallback(
    async (id: string, title?: string) => {
      stop();
      setSourceTitle(title ?? null);
      setProgress({ current: 0, total: 1, status: 'pending', updatedAt: Date.now() });
      try {
        const { taskId } = await storybookApi.copyAsync(id);
        const poll = async () => {
          try {
            const p = await storybookApi.copyProgress(taskId);
            setProgress(p);
            if (p.status === 'done') {
              qc.invalidateQueries({ queryKey: ['storybooks'] });
              return;
            }
            if (p.status === 'error') return;
            pollingRef.current = setTimeout(poll, 700);
          } catch (e) {
            setProgress({
              current: 0,
              total: 1,
              status: 'error',
              error: (e as Error).message,
              updatedAt: Date.now(),
            });
          }
        };
        void poll();
      } catch (e) {
        setProgress({
          current: 0,
          total: 1,
          status: 'error',
          error: (e as Error).message,
          updatedAt: Date.now(),
        });
      }
    },
    [qc, stop]
  );

  return { progress, sourceTitle, start, reset };
}

/** /editor2 — base 책에서 새 레벨 variant 생성 (`${baseId}__L${level}`). */
export function useCreateVariant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, level }: { id: string; level: ReadingLevel }) =>
      storybookApi.createVariant(id, level),
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
