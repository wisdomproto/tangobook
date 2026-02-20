import { apiClient, apiGet } from '@/lib/axios';

export interface BgmItem {
  id: string;
  title: string;
  url: string;
  createdAt: string;
}

export const settingsApi = {
  getBgmList: () => apiGet<BgmItem[]>('/images/bgm-list'),

  analyzeArtStyle: async (file: File): Promise<{ prompt: string }> => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await apiClient.post('/images/analyze-style', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return (res.data as { success: true; data: { prompt: string } }).data;
  },

  uploadBgm: async (
    file: File,
    storybookId: string,
    storybookTitle: string
  ): Promise<{ audioUrl: string }> => {
    const formData = new FormData();
    formData.append('audio', file);
    formData.append('storybookId', storybookId);
    formData.append('storybookTitle', storybookTitle);
    const res = await apiClient.post('/images/upload-audio', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return (res.data as { success: true; data: { audioUrl: string } }).data;
  },
};
