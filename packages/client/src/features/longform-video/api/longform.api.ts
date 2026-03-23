import { apiGet, apiPost, apiDelete } from '@/lib/axios';
import type {
  LongformScene,
  PromptPreset,
  YouTubeUploadMeta,
  YouTubePreset,
  YouTubeGeneratedMeta,
} from '@tangobook/shared';

export const longformApi = {
  analyze: (req: {
    storybookId: string;
    projectId: string;
    promptPresetId: string;
    model?: string;
    excludePages?: number[];
  }) => apiPost<{ scenes: LongformScene[] }>('/longform/analyze', req),
  getAnalyzeProgress: (projectId: string) =>
    apiGet<{ progress: number; step: string } | null>(`/longform/analyze-progress/${projectId}`),
  analyzeScene: (req: {
    storybookId: string;
    projectId: string;
    sceneId: string;
    promptPresetId: string;
    model?: string;
  }) => apiPost<{ scene: LongformScene }>('/longform/analyze-scene', req),
  generateClip: (req: { storybookId: string; projectId: string; sceneId: string }) =>
    apiPost<{ clipUrl: string; sfxUrl: string }>('/longform/generate-clip', req),
  generateAll: (req: {
    storybookId: string;
    projectId: string;
    startPage?: number;
    endPage?: number;
  }) => apiPost<{ message: string }>('/longform/generate-all', req),
  getProgress: (projectId: string) =>
    apiGet<{ progress: number; step: string; currentScene?: number } | null>(
      `/longform/progress/${projectId}`
    ),
  render: (req: { storybookId: string; projectId: string }) =>
    apiPost<{ message: string }>('/longform/render', req),
  cancelRender: (projectId: string) =>
    apiPost<{ cancelled: boolean }>('/longform/cancel-render', { projectId }),
  getRenderProgress: (projectId: string) =>
    apiGet<{ progress: number; step: string; outputUrl?: string } | null>(
      `/longform/render-progress/${projectId}`
    ),
  uploadBgm: (formData: FormData) =>
    apiPost<{ bgmUrl: string }>('/longform/upload-bgm', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    } as any),

  // YouTube
  youtubeAuthUrl: () => apiGet<{ url: string }>('/longform/youtube/auth-url'),
  youtubeStatus: () => apiGet<{ connected: boolean }>('/longform/youtube/status'),
  youtubeDisconnect: () => apiPost<{ disconnected: boolean }>('/longform/youtube/disconnect'),
  youtubeUpload: (req: { storybookId: string; projectId: string; meta: YouTubeUploadMeta }) =>
    apiPost<{ message: string }>('/longform/youtube/upload', req),
  getYouTubeProgress: (projectId: string) =>
    apiGet<{ progress: number; step: string } | null>(`/longform/youtube/progress/${projectId}`),
  generateYouTubeMeta: (req: { storybookId: string; projectId: string; prompt: string }) =>
    apiPost<YouTubeGeneratedMeta>('/longform/youtube/generate-meta', req),
};

export const ytPresetApi = {
  list: () => apiGet<YouTubePreset[]>('/youtube-presets'),
  create: (data: { name: string; prompt: string }) =>
    apiPost<YouTubePreset>('/youtube-presets', data),
  update: (id: string, data: { name?: string; prompt?: string }) =>
    apiPost<YouTubePreset>(`/youtube-presets/${id}`, data),
  remove: (id: string) => apiDelete(`/youtube-presets/${id}`),
};

export const presetApi = {
  list: () => apiGet<PromptPreset[]>('/prompt-presets'),
  create: (data: { name: string; systemPrompt: string }) =>
    apiPost<PromptPreset>('/prompt-presets', data),
  update: (id: string, data: Partial<PromptPreset>) =>
    apiPost<PromptPreset>(`/prompt-presets/${id}`, data),
  remove: (id: string) => apiDelete(`/prompt-presets/${id}`),
};
