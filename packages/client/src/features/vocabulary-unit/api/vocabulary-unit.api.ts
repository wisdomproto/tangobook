import { apiGet, apiPost, apiDelete } from '@/lib/axios';
import type { VocabularyUnit, VocabularyUnitSummary } from '@tangobook/shared';

export const vocabularyUnitApi = {
  list(): Promise<VocabularyUnitSummary[]> {
    return apiGet<VocabularyUnitSummary[]>('/vocabulary-units');
  },
  getById(id: string): Promise<VocabularyUnit> {
    return apiGet<VocabularyUnit>(`/vocabulary-units/${id}`);
  },
  upsert(unit: VocabularyUnit): Promise<void> {
    return apiPost<void>('/vocabulary-units', unit);
  },
  remove(id: string): Promise<void> {
    return apiDelete<void>(`/vocabulary-units/${id}`);
  },
  seedCambridge(): Promise<{ added: number; updated: number }> {
    return apiPost<{ added: number; updated: number }>('/vocabulary-units/seed/cambridge', {});
  },
};
