import { apiGet, apiPost, apiDelete, apiClient } from '@/lib/axios';
import type { Character, SavedCharacter, ImageGenerationResult } from '@tangobook/shared';

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

  // 캐릭터 라이브러리
  getLibrary: () => apiGet<SavedCharacter[]>('/character-library'),
  saveToLibrary: (character: Character) => apiPost<SavedCharacter>('/character-library', character),
  updateInLibrary: (name: string, updates: Partial<Character>) =>
    apiClient
      .patch(`/character-library/by-name/${encodeURIComponent(name)}`, updates)
      .then((r) => (r.data as { success: true; data: SavedCharacter | null }).data),
  removeFromLibrary: (id: string) => apiDelete<void>(`/character-library/${id}`),
  removeAllFromLibrary: () => apiDelete<void>('/character-library/all'),
  applyEnglishNames: () =>
    apiPost<{ updated: number }>('/character-library/apply-english-names', {}),
};
