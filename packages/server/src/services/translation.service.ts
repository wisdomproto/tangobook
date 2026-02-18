import { generateTextWithGemini } from '../providers/gemini.provider.js';
import type { TranslationResult } from '@tangobook/shared';

interface TranslatePageRequest {
  text: string;
  targetLanguage: string;
  storybookId: string;
  pageNumber: number;
}

interface TranslateBatchRequest {
  pages: Array<{ pageNumber: number; text: string }>;
  targetLanguage: string;
  storybookId: string;
}

export const TranslationService = {
  async translatePage(req: TranslatePageRequest): Promise<TranslationResult> {
    const { text, targetLanguage } = req;
    const translated = await translateText(text, targetLanguage);
    return { language: targetLanguage, text: translated };
  },

  async translateBatch(req: TranslateBatchRequest): Promise<TranslationResult[]> {
    const { pages, targetLanguage } = req;

    const results = await Promise.allSettled(
      pages.map(async (page) => {
        const translated = await translateText(page.text, targetLanguage);
        return { language: targetLanguage, text: translated };
      })
    );

    return results.map((r, i) =>
      r.status === 'fulfilled' ? r.value : { language: targetLanguage, text: pages[i].text }
    );
  },
};

async function translateText(text: string, targetLanguage: string): Promise<string> {
  const prompt = `Translate the following Korean children's storybook text to ${targetLanguage}. Keep the tone warm and appropriate for young children. Return only the translated text, no explanation.

Text: ${text}`;

  return generateTextWithGemini(prompt);
}
