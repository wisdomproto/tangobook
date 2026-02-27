import { apiClient, apiGet, apiPost, apiDelete } from '@/lib/axios';
import type { PhonicsAudioCategory, PhonicsAudioItem } from '@tangobook/shared';

export interface TitleTemplate {
  id: string;
  imageUrl: string;
  createdAt: string;
}

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

  // 파닉스 음원 라이브러리
  getPhonicsLibrary: () =>
    apiGet<{ mod_phonics: PhonicsAudioItem[]; mod_english: PhonicsAudioItem[] }>(
      '/phonics-library'
    ),

  uploadPhonicsAudio: async (
    files: File[],
    category: PhonicsAudioCategory
  ): Promise<PhonicsAudioItem[]> => {
    const formData = new FormData();
    formData.append('category', category);
    files.forEach((f) => formData.append('files', f));
    const res = await apiClient.post('/phonics-library/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return (res.data as { success: true; data: PhonicsAudioItem[] }).data;
  },

  deletePhonicsAudio: async (category: PhonicsAudioCategory, sound: string): Promise<void> => {
    await apiClient.delete(`/phonics-library/${category}/${encodeURIComponent(sound)}`);
  },

  // 제목 스타일 템플릿 (전역)
  getTitleTemplates: () => apiGet<TitleTemplate[]>('/settings/title-templates'),

  addTitleTemplate: (imageUrl: string) =>
    apiPost<TitleTemplate>('/settings/title-templates', { imageUrl }),

  deleteTitleTemplate: (id: string) => apiDelete<void>(`/settings/title-templates/${id}`),
};
