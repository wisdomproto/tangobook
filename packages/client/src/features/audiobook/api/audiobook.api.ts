import { apiGet, apiPost } from '@/lib/axios';

export type AudiobookRenderProgress = {
  progress: number;
  step: string;
  error?: string;
};

export const audiobookApi = {
  render: (data: { storybookId: string; projectId: string }) =>
    apiPost<{ outputUrl: string }>('/audiobooks/render', data),

  getRenderProgress: (projectId: string) =>
    apiGet<AudiobookRenderProgress | null>(`/audiobooks/render-progress/${projectId}`),

  youtubeUpload: (data: { storybookId: string; projectId: string }) =>
    apiPost<{ videoId: string; url: string }>('/audiobooks/youtube/upload', data),

  youtubeGenerateMeta: (data: { storybookId: string; projectId: string; preset?: string }) =>
    apiPost('/audiobooks/youtube/generate-meta', data),

  // Reuse longform YouTube endpoints for auth (shared OAuth tokens)
  youtubeAuthUrl: () => apiGet<{ url: string }>('/longform/youtube/auth-url'),

  youtubeStatus: () => apiGet<{ connected: boolean }>('/longform/youtube/status'),
};
