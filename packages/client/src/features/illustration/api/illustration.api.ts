import { apiClient, apiPost } from '@/lib/axios';
import type { Page, Character, ImageGenerationResult, ApiResponse } from '@tangobook/shared';

interface GenerateIllustrationRequest {
  page: Page;
  artStyle: string;
  characterReferences: Array<Character & { imageUrl?: string }>;
  previousIllustrationUrl?: string;
  currentImageUrl?: string;
  settings?: { aspectRatio?: string };
  storybookId: string;
  storybookTitle: string;
  model?: string;
}

export const illustrationApi = {
  generate: (req: GenerateIllustrationRequest, signal?: AbortSignal) =>
    apiPost<ImageGenerationResult>('/images/illustration', req, { signal }),

  upload: async (
    file: File,
    storybookId: string,
    storybookTitle: string,
    pageNumber: number
  ): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('storybookId', storybookId);
    formData.append('storybookTitle', storybookTitle);
    formData.append('type', 'illustration');
    formData.append('pageNumber', String(pageNumber));
    const res = await apiClient.post<ApiResponse<ImageGenerationResult>>(
      '/images/upload',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return (res.data as { success: true; data: ImageGenerationResult }).data.imageUrl;
  },
};
