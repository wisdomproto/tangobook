import { apiGet, apiPost, apiDelete } from '@/lib/axios';
import type {
  Storybook,
  StorybookSummary,
  GenerateStorybookRequest,
  GenerateStoryRequest,
  GeneratePhonicsBookRequest,
  StoryDraftPage,
  SceneStructure,
  ReadingLevel,
} from '@tangobook/shared';

export interface CopyProgress {
  current: number;
  total: number;
  status: 'pending' | 'done' | 'error';
  newId?: string;
  newTitle?: string;
  error?: string;
  updatedAt: number;
}

export const storybookApi = {
  list: () => apiGet<StorybookSummary[]>('/storybooks'),
  getById: (id: string) => apiGet<Storybook>(`/storybooks/${id}`),
  save: (storybook: Storybook) => apiPost<Storybook>('/storybooks', { storybook }),
  delete: (id: string) => apiDelete<{ message: string }>(`/storybooks/${id}`),
  copy: (id: string) => apiPost<Storybook>(`/storybooks/${id}/copy`),
  copyAsync: (id: string) => apiPost<{ taskId: string }>(`/storybooks/${id}/copy-async`),
  copyProgress: (taskId: string) => apiGet<CopyProgress>(`/storybooks/copy-progress/${taskId}`),
  createVariant: (id: string, level: ReadingLevel) =>
    apiPost<Storybook>(`/storybooks/${id}/variants/${level}`),
  generateStory: (req: GenerateStoryRequest) =>
    apiPost<StoryDraftPage[]>('/storybooks/generate-story', req),
  generate: (req: GenerateStorybookRequest) => apiPost<Storybook>('/storybooks/generate', req),
  generatePhonicsBook: (req: GeneratePhonicsBookRequest) =>
    apiPost<Storybook>('/phonics/generate', req),
  generateScenePrompts: (pages: Array<{ pageNumber: number; text: string; imageUrl?: string }>) =>
    apiPost<
      Array<{
        pageNumber: number;
        scene_description: string;
        scene_description_en: string;
        scene_structure: SceneStructure;
      }>
    >('/storybooks/generate-scene-prompts', { pages }),
};
