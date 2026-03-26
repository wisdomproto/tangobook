import { apiGet, apiPost } from '@/lib/axios';
import type { YouTubeUploadMeta, YouTubeGeneratedMeta, YouTubePreset } from '@tangobook/shared';

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

  // YouTube upload (fire-and-forget — poll progress separately)
  youtubeUpload: (data: { storybookId: string; projectId: string; meta: YouTubeUploadMeta }) =>
    apiPost('/audiobooks/youtube/upload', data),

  getYouTubeProgress: (projectId: string) =>
    apiGet<AudiobookRenderProgress | null>(`/audiobooks/youtube/progress/${projectId}`),

  youtubeGenerateMeta: (data: { storybookId: string; projectId: string; prompt: string }) =>
    apiPost<YouTubeGeneratedMeta>('/audiobooks/youtube/generate-meta', data),

  // Reuse longform YouTube endpoints for auth (shared OAuth tokens)
  youtubeAuthUrl: () => apiGet<{ url: string }>('/longform/youtube/auth-url'),
  youtubeStatus: () => apiGet<{ connected: boolean }>('/longform/youtube/status'),

  // YouTube captions
  youtubeUploadCaptions: (data: { storybookId: string; projectId: string; languages: string[] }) =>
    apiPost('/audiobooks/youtube/upload-captions', data),

  getCaptionProgress: (projectId: string) =>
    apiGet<AudiobookRenderProgress | null>(`/audiobooks/youtube/caption-progress/${projectId}`),

  // YouTube presets — shared with longform
  youtubePresets: () => apiGet<YouTubePreset[]>('/youtube-presets'),
  createYoutubePreset: (data: { name: string; prompt: string }) =>
    apiPost<YouTubePreset>('/youtube-presets', data),
};
