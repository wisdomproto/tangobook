import { apiGet, apiPost } from '@/lib/axios';
import type {
  BlogPost,
  BlogSection,
  BlogGenerateConfig,
  BlogAutoConfig,
  NaverKeywordResult,
} from '@tangobook/shared';

export const blogApi = {
  generate: (config: BlogGenerateConfig) => apiPost<BlogPost>('/marketing/blog/generate', config),

  generateConfig: (storybookId: string) =>
    apiPost<BlogAutoConfig>('/marketing/blog/generate-config', { storybookId }),

  regenerateSection: (
    storybookId: string,
    blogPostId: string,
    sectionId: string,
    instruction?: string,
    model?: string
  ) =>
    apiPost<BlogSection>('/marketing/blog/regenerate-section', {
      storybookId,
      blogPostId,
      sectionId,
      instruction,
      model,
    }),

  searchKeywords: (query: string) =>
    apiGet<NaverKeywordResult[]>(
      `/marketing/blog/search-keywords?query=${encodeURIComponent(query)}`
    ),
};
