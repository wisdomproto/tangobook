import { apiPost } from '@/lib/axios';
import type { Character, ImageGenerationResult } from '@tangobook/shared';

interface GenerateCoverRequest {
  storybook: { title: string; coverPrompt?: string; artStyle: string };
  characterReferences: Array<Character & { referenceImage?: string }>;
  settings?: { aspectRatio?: string };
  currentImageUrl?: string;
  model?: string;
}

export const coverApi = {
  generate: (req: GenerateCoverRequest) => apiPost<ImageGenerationResult>('/images/cover', req),
};
