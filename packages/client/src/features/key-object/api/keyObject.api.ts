import { apiPost } from '@/lib/axios';
import type { KeyObject, ImageGenerationResult, VocabularyItem } from '@tangobook/shared';

interface GenerateKeyObjectRequest {
  keyObject: KeyObject;
  artStyle: string;
  storybookId: string;
  storybookTitle: string;
  currentImageUrl?: string;
  model?: string;
}

interface GenerateVocabularyRequest {
  vocabularyItems: VocabularyItem[];
  artStyle: string;
  settings?: { aspectRatio?: string };
  storybookId: string;
  storybookTitle: string;
}

interface VocabularyResult {
  word: string;
  korean: string;
  imageUrl: string;
  success: boolean;
}

export const keyObjectApi = {
  generate: (req: GenerateKeyObjectRequest, signal?: AbortSignal) =>
    apiPost<ImageGenerationResult>('/images/key-object', req, { signal }),

  generateVocabulary: (req: GenerateVocabularyRequest) =>
    apiPost<VocabularyResult[]>('/images/vocabulary', req),
};
