import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vocabularyApi, type VocabSearchParams } from '../api/vocabulary.api';

export function useVocabularyList(params?: VocabSearchParams) {
  return useQuery({
    queryKey: ['vocabulary-db', params],
    queryFn: () => vocabularyApi.list(params),
  });
}

export function useVocabByStorybook(storybookId: string | undefined) {
  return useQuery({
    queryKey: ['vocabulary-db', 'storybook', storybookId],
    queryFn: () => vocabularyApi.getByStorybook(storybookId!),
    enabled: !!storybookId,
  });
}

export function useVocabByWord(word: string | undefined) {
  return useQuery({
    queryKey: ['vocabulary-db', 'word', word],
    queryFn: () => vocabularyApi.getByWord(word!),
    enabled: !!word,
  });
}

export function useBulkSyncVocabulary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: vocabularyApi.bulkSync,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vocabulary-db'] });
    },
  });
}

export function useSyncVocabulary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: vocabularyApi.syncFromStorybook,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vocabulary-db'] });
    },
  });
}
