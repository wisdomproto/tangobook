import { apiGet, apiPost, apiDelete } from '@/lib/axios';
import type { LongformScene, PromptPreset } from '@tangobook/shared';

export const longformApi = {
  analyze: (req: { storybookId: string; projectId: string; promptPresetId: string }) =>
    apiPost<{ scenes: LongformScene[] }>('/longform/analyze', req),
  analyzeScene: (req: {
    storybookId: string;
    projectId: string;
    sceneId: string;
    promptPresetId: string;
  }) => apiPost<{ scene: LongformScene }>('/longform/analyze-scene', req),
  generateClip: (req: { storybookId: string; projectId: string; sceneId: string }) =>
    apiPost<{ clipUrl: string; sfxUrl: string }>('/longform/generate-clip', req),
  generateAll: (req: { storybookId: string; projectId: string }) =>
    apiPost<{ message: string }>('/longform/generate-all', req),
  getProgress: (projectId: string) =>
    apiGet<{ progress: number; step: string; currentScene?: number } | null>(
      `/longform/progress/${projectId}`
    ),
  render: (req: { storybookId: string; projectId: string }) =>
    apiPost<{ message: string }>('/longform/render', req),
  getRenderProgress: (projectId: string) =>
    apiGet<{ progress: number; step: string; outputUrl?: string } | null>(
      `/longform/render-progress/${projectId}`
    ),
  uploadBgm: (formData: FormData) =>
    apiPost<{ bgmUrl: string }>('/longform/upload-bgm', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    } as any),
};

export const presetApi = {
  list: () => apiGet<PromptPreset[]>('/prompt-presets'),
  create: (data: { name: string; systemPrompt: string }) =>
    apiPost<PromptPreset>('/prompt-presets', data),
  update: (id: string, data: Partial<PromptPreset>) =>
    apiPost<PromptPreset>(`/prompt-presets/${id}`, data),
  remove: (id: string) => apiDelete(`/prompt-presets/${id}`),
};
