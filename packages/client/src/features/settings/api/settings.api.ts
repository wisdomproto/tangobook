import { apiClient, apiGet, apiPost, apiDelete } from '@/lib/axios';
import type {
  PhonicsAudioCategory,
  PhonicsAudioItem,
  SystemSoundLanguage,
  SystemSoundType,
  SystemSoundItem,
  SavedArtStyle,
} from '@tangobook/shared';

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
    apiGet<{
      mod_phonics: PhonicsAudioItem[];
      mod_english: PhonicsAudioItem[];
      mod_korean: PhonicsAudioItem[];
    }>('/phonics-library'),

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

  deleteAllPhonicsAudio: async (category: PhonicsAudioCategory): Promise<{ deleted: number }> => {
    const res = await apiClient.delete(`/phonics-library/${category}`);
    return (res.data as { success: true; data: { deleted: number } }).data;
  },

  // 시스템 사운드 라이브러리
  getSystemSounds: () =>
    apiGet<{
      korean: { correct: SystemSoundItem[]; wrong: SystemSoundItem[] };
      english: { correct: SystemSoundItem[]; wrong: SystemSoundItem[] };
    }>('/system-sounds'),

  uploadSystemSounds: async (
    files: File[],
    language: SystemSoundLanguage,
    type: SystemSoundType
  ): Promise<SystemSoundItem[]> => {
    const formData = new FormData();
    formData.append('language', language);
    formData.append('type', type);
    files.forEach((f) => formData.append('files', f));
    const res = await apiClient.post('/system-sounds/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return (res.data as { success: true; data: SystemSoundItem[] }).data;
  },

  deleteSystemSound: async (
    language: SystemSoundLanguage,
    type: SystemSoundType,
    name: string
  ): Promise<void> => {
    await apiClient.delete(`/system-sounds/${language}/${type}/${encodeURIComponent(name)}`);
  },

  deleteAllSystemSounds: async (
    language: SystemSoundLanguage,
    type: SystemSoundType
  ): Promise<{ deleted: number }> => {
    const res = await apiClient.delete(`/system-sounds/${language}/${type}`);
    return (res.data as { success: true; data: { deleted: number } }).data;
  },

  // 제목 스타일 템플릿 (전역)
  getTitleTemplates: () => apiGet<TitleTemplate[]>('/settings/title-templates'),

  addTitleTemplate: (imageUrl: string) =>
    apiPost<TitleTemplate>('/settings/title-templates', { imageUrl }),

  deleteTitleTemplate: (id: string) => apiDelete<void>(`/settings/title-templates/${id}`),

  // 그림체 라이브러리
  getArtStyleLibrary: () => apiGet<SavedArtStyle[]>('/art-style-library'),
  saveArtStyle: (data: { name: string; prompt: string; referenceImageUrl?: string }) =>
    apiPost<SavedArtStyle>('/art-style-library', data),
  removeArtStyle: (id: string) => apiDelete<void>(`/art-style-library/${id}`),
  removeAllArtStyles: () => apiDelete<void>('/art-style-library/all'),
};
