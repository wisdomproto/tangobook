import { apiPost, apiClient } from '@/lib/axios';
import type { PhonicsFlashcard } from '@tangobook/shared';

export const phonicsApi = {
  generateWordImage: (
    data: {
      word: string;
      description?: string;
      artStyle: string;
      storybookId: string;
      storybookTitle: string;
      model?: string;
      aspectRatio?: string;
      characterReferences?: Array<{
        name: string;
        description?: string;
        descriptionEn?: string;
        referenceImage?: string;
      }>;
      isolatedObject?: boolean;
    },
    signal?: AbortSignal
  ) => apiPost<{ imageUrl: string }>('/images/phonics-word', data, { signal }),

  generateFlashcardImages: (data: {
    flashcards: PhonicsFlashcard[];
    artStyle: string;
    storybookId: string;
    storybookTitle: string;
    model?: string;
  }) =>
    apiPost<Array<{ word: string; imageUrl: string; success: boolean }>>(
      '/images/phonics-flashcards',
      data
    ),

  generateWordTts: (
    data: {
      text: string;
      provider: 'gemini' | 'minimax' | 'elevenlabs';
      voice?: string;
      language?: string;
      storybookId: string;
      identifier: string;
    },
    signal?: AbortSignal
  ) => apiPost<{ audioUrl: string }>('/tts/generate', data, { signal }),

  concatPhonicsAudio: (
    data: { text: string; storybookId: string; identifier: string },
    signal?: AbortSignal
  ) => apiPost<{ audioUrl: string }>('/phonics-library/concat', data, { signal }),

  uploadTts: async (file: File, storybookId: string, identifier: string) => {
    const form = new FormData();
    form.append('audio', file);
    form.append('storybookId', storybookId);
    form.append('identifier', identifier);
    const res = await apiClient.post<{ success: true; data: { audioUrl: string } }>(
      '/tts/upload',
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data.data;
  },

  deleteImage: (imageUrl: string) => apiPost<{ message: string }>('/images/cleanup', { imageUrl }),

  uploadImage: async (
    file: File,
    storybookId: string,
    storybookTitle: string,
    identifier: string
  ) => {
    const form = new FormData();
    form.append('image', file);
    form.append('storybookId', storybookId);
    form.append('storybookTitle', storybookTitle);
    form.append('type', 'phonics');
    form.append('characterName', identifier);
    const res = await apiClient.post<{ success: true; data: { imageUrl: string } }>(
      '/images/upload',
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data.data;
  },
};
