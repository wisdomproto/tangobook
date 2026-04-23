import { apiGet, apiPost, apiDelete } from '@/lib/axios';
import type {
  LongformScene,
  PromptPreset,
  YouTubeUploadMeta,
  YouTubePreset,
  YouTubeGeneratedMeta,
  YouTubeChannel,
  GeneratedCaption,
} from '@tangobook/shared';
import type { RenderManifest } from '../utils/client-renderer';

export const longformApi = {
  analyze: (req: {
    storybookId: string;
    projectId: string;
    promptPresetId: string;
    model?: string;
    excludePages?: number[];
  }) => apiPost<{ message: string }>('/longform/analyze', req),
  getAnalyzeProgress: (projectId: string) =>
    apiGet<{ progress: number; step: string; error?: string } | null>(
      `/longform/analyze-progress/${projectId}`
    ),
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
  deleteRender: (data: { storybookId: string; projectId: string }) =>
    apiPost('/longform/delete-render', data),
  getRenderProgress: (projectId: string) =>
    apiGet<{ progress: number; step: string; outputUrl?: string } | null>(
      `/longform/render-progress/${projectId}`
    ),
  renderShortform: (req: {
    storybookId: string;
    projectId: string;
    title?: string;
    logoUrl?: string;
  }) => apiPost<{ message: string }>('/longform/render-shortform', req),
  getShortformProgress: (projectId: string) =>
    apiGet<{ progress: number; step: string; error?: string } | null>(
      `/longform/shortform-progress/${projectId}`
    ),
  uploadClip: (formData: FormData) =>
    apiPost<{ clipUrl: string; sfxUrl: string }>('/longform/upload-clip', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    } as any),
  uploadBgm: (formData: FormData) =>
    apiPost<{ bgmUrl: string }>('/longform/upload-bgm', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    } as any),

  // Client-side rendering (hybrid)
  prepareRender: (req: { storybookId: string; projectId: string }) =>
    apiPost<{ message: string }>('/longform/prepare-render', req),

  renderManifest: (req: { storybookId: string; projectId: string }) =>
    apiPost<RenderManifest>('/longform/render-manifest', req),

  presignedUpload: (req: { storybookId: string; projectId: string }) =>
    apiPost<{ uploadUrl: string; publicUrl: string }>('/longform/presigned-upload', req),

  confirmRender: (req: { storybookId: string; projectId: string; outputUrl: string }) =>
    apiPost<{ outputUrl: string }>('/longform/confirm-render', req),

  // YouTube
  youtubeAuthUrl: (name?: string) =>
    apiGet<{ url: string }>(
      `/longform/youtube/auth-url${name ? `?name=${encodeURIComponent(name)}` : ''}`
    ),
  youtubeStatus: () => apiGet<{ connected: boolean }>('/longform/youtube/status'),
  youtubeChannels: () => apiGet<YouTubeChannel[]>('/longform/youtube/channels'),
  youtubeRemoveChannel: (channelId: string) =>
    apiPost('/longform/youtube/remove-channel', { channelId }),
  youtubeDisconnect: () => apiPost<{ disconnected: boolean }>('/longform/youtube/disconnect'),
  youtubeUpload: (req: {
    storybookId: string;
    projectId: string;
    meta: YouTubeUploadMeta;
    channelId?: string;
  }) => apiPost<{ message: string }>('/longform/youtube/upload', req),
  getYouTubeProgress: (projectId: string) =>
    apiGet<{ progress: number; step: string } | null>(`/longform/youtube/progress/${projectId}`),
  generateYouTubeMeta: (req: { storybookId: string; projectId: string; prompt: string }) =>
    apiPost<YouTubeGeneratedMeta>('/longform/youtube/generate-meta', req),

  // YouTube captions
  youtubeUploadCaptions: (req: {
    storybookId: string;
    projectId: string;
    languages: string[];
    channelId?: string;
  }) => apiPost('/longform/youtube/upload-captions', req),
  generateCaptions: (req: { storybookId: string; projectId: string; languages: string[] }) =>
    apiPost<{
      baseLang: string;
      generatedCaptions: Record<string, GeneratedCaption>;
    }>('/longform/youtube/generate-captions', req),

  // Manually link an externally-uploaded video
  youtubeLinkVideo: (data: { storybookId: string; projectId: string; videoUrl: string }) =>
    apiPost<{
      videoId: string;
      videoUrl: string;
      ownerConnected: boolean;
      channelTitle?: string;
    }>('/longform/youtube/link-video', data),
  getCaptionProgress: (projectId: string) =>
    apiGet<{ progress: number; step: string } | null>(
      `/longform/youtube/caption-progress/${projectId}`
    ),
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
