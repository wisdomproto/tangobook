import { apiGet, apiPost } from '@/lib/axios';
import type { AudiobookGenerateRequest, AudiobookResult } from '@tangobook/shared';

export interface AudiobookProgress {
  progress: number;
  step: string;
}

export const audiobookApi = {
  generate: (req: AudiobookGenerateRequest) =>
    apiPost<AudiobookResult>('/audiobooks/generate', req),
  getProgress: (projectId: string) =>
    apiGet<AudiobookProgress | null>(`/audiobooks/progress/${projectId}`),
};
