import { apiGet, apiPost, apiDelete } from '@/lib/axios';
import type {
  Storybook,
  StorybookSummary,
  GenerateStorybookRequest,
  GenerateStoryRequest,
  StoryDraftPage,
} from '@tangobook/shared';

export const storybookApi = {
  list: () => apiGet<StorybookSummary[]>('/storybooks'),
  getById: (id: string) => apiGet<Storybook>(`/storybooks/${id}`),
  save: (storybook: Storybook) => apiPost<Storybook>('/storybooks', { storybook }),
  delete: (id: string) => apiDelete<{ message: string }>(`/storybooks/${id}`),
  copy: (id: string) => apiPost<Storybook>(`/storybooks/${id}/copy`),
  generateStory: (req: GenerateStoryRequest) =>
    apiPost<StoryDraftPage[]>('/storybooks/generate-story', req),
  generate: (req: GenerateStorybookRequest) => apiPost<Storybook>('/storybooks/generate', req),
};
