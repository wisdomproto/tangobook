import { apiPost } from '@/lib/axios';
import type { CardNewsProject } from '@tangobook/shared';

export interface CardNewsGenerateRequest {
  storybookId: string;
  colorTheme?: string;
  slideCount?: number;
  source?: { type: 'storybook' } | { type: 'blog'; blogPostId: string };
}

export const cardNewsApi = {
  generate: (params: CardNewsGenerateRequest) =>
    apiPost<CardNewsProject>('/marketing/card-news/generate', params),
};
