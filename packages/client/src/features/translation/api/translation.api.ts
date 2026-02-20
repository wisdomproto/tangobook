import { apiPost } from '@/lib/axios';
import type { TranslationResult } from '@tangobook/shared';

interface TranslatePageRequest {
  text: string;
  targetLanguage: string;
  storybookId: string;
  pageNumber: number;
}

interface TranslateBatchRequest {
  pages: Array<{ pageNumber: number; text: string }>;
  targetLanguage: string;
  storybookId: string;
}

export const translationApi = {
  page: (req: TranslatePageRequest) => apiPost<TranslationResult>('/translation/page', req),
  batch: (req: TranslateBatchRequest) => apiPost<TranslationResult[]>('/translation/batch', req),
};
