import { apiGet, apiPost, apiDelete } from '@/lib/axios';
import type { VocabularyUnit, VocabularyUnitSummary } from '@tangobook/shared';

interface GenerateImageReq {
  word: string;
  korean?: string;
  description?: string;
  customPrompt?: string;
  unitId: string;
  artStyle?: string;
  currentImageUrl?: string;
  model?: string;
}

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
  /** 단어 이미지 생성 — KeyObject 패턴 응용. R2 prefix vocabulary-units/{unitId}/ */
  generateImage(req: GenerateImageReq, signal?: AbortSignal): Promise<{ imageUrl: string }> {
    return apiPost<{ imageUrl: string }>('/images/vocabulary-unit-word', req, { signal });
  },
};
