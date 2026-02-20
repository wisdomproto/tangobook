import { apiPost } from '@/lib/axios';
import type { TtsResult } from '@tangobook/shared';

interface TtsGenerateRequest {
  text: string;
  provider: 'gemini';
  voice?: string;
  language?: string;
  storybookId: string;
  pageNumber: number;
}

interface TtsBatchRequest {
  pages: Array<{ pageNumber: number; text: string }>;
  provider: 'gemini';
  voice?: string;
  language?: string;
  storybookId: string;
}

interface TtsBatchResult {
  pageNumber: number;
  audioUrl: string;
  success: boolean;
}

export const ttsApi = {
  generate: (req: TtsGenerateRequest) => apiPost<TtsResult>('/tts/generate', req),
  batch: (req: TtsBatchRequest) => apiPost<TtsBatchResult[]>('/tts/batch', req),
};
