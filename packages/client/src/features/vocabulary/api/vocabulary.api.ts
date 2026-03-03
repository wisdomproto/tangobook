import { apiGet, apiPost, apiDelete } from '@/lib/axios';
import type { VocabEntry, VocabSourceType } from '@tangobook/shared';

export interface VocabSearchParams {
  query?: string;
  storybookId?: string;
  sourceType?: VocabSourceType;
}

export const vocabularyApi = {
  list: (params?: VocabSearchParams) => {
    const search = new URLSearchParams();
    if (params?.query) search.set('query', params.query);
    if (params?.storybookId) search.set('storybookId', params.storybookId);
    if (params?.sourceType) search.set('sourceType', params.sourceType);
    const qs = search.toString();
    return apiGet<VocabEntry[]>(`/vocabulary-db${qs ? `?${qs}` : ''}`);
  },

  getByWord: (word: string) =>
    apiGet<VocabEntry>(`/vocabulary-db/word/${encodeURIComponent(word)}`),

  getByStorybook: (storybookId: string) =>
    apiGet<VocabEntry[]>(`/vocabulary-db/storybook/${storybookId}`),

  syncFromStorybook: (storybookId: string) =>
    apiPost<{ added: number; updated: number }>('/vocabulary-db/sync', { storybookId }),

  bulkSync: () =>
    apiPost<{ total: number; added: number; updated: number }>('/vocabulary-db/bulk-sync', {}),

  reset: () => apiDelete<{ message: string }>('/vocabulary-db/reset'),
};
