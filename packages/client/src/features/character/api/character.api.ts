import { apiPost, apiClient } from '@/lib/axios';
import type { Character, ImageGenerationResult } from '@tangobook/shared';

interface GenerateCharacterRequest {
  character: Character;
  artStyle: string;
  settings?: { aspectRatio?: string };
  storybookId: string;
  storybookTitle: string;
  currentImageUrl?: string;
  model?: string;
}

export const characterApi = {
  generate: (req: GenerateCharacterRequest, signal?: AbortSignal) =>
    apiPost<ImageGenerationResult>('/images/character', req, { signal }),

  upload: async (
    file: File,
    storybookId: string,
    storybookTitle: string,
    characterName: string
  ) => {
    const form = new FormData();
    form.append('image', file);
    form.append('storybookId', storybookId);
    form.append('storybookTitle', storybookTitle);
    form.append('type', 'character');
    form.append('characterName', characterName);
    const res = await apiClient.post<{ success: true; data: ImageGenerationResult }>(
      '/images/upload',
      form,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return res.data.data;
  },

  cleanup: (imageUrl: string) => apiPost<{ message: string }>('/images/cleanup', { imageUrl }),
};
