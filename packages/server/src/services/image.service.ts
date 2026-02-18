import axios from 'axios';
import { generateImageWithGemini } from '../providers/gemini.provider.js';
import { R2Repository } from '../repositories/r2.repository.js';
import type { Character, Page, KeyObject, VocabularyItem } from '@tangobook/shared';

interface ImageSettings {
  aspectRatio?: string;
  enforceNoText?: boolean;
}

interface CharacterImageRequest {
  character: Character;
  artStyle: string;
  settings?: ImageSettings;
  storybookId: string;
  storybookTitle: string;
}

interface IllustrationRequest {
  page: Page;
  artStyle: string;
  characterReferences: Array<Character & { imageUrl?: string }>;
  settings?: ImageSettings;
  storybookId: string;
  storybookTitle: string;
}

interface CoverRequest {
  storybook: { title: string; coverPrompt?: string; artStyle: string };
  characterReferences: Array<Character & { referenceImage?: string }>;
  settings?: ImageSettings;
}

interface KeyObjectRequest {
  keyObject: KeyObject;
  artStyle: string;
  storybookId: string;
  storybookTitle: string;
}

interface VocabularyRequest {
  vocabularyItems: VocabularyItem[];
  artStyle: string;
  settings?: ImageSettings;
  storybookId: string;
  storybookTitle: string;
}

async function urlToBase64(url: string): Promise<{ base64: string; mimeType: string } | null> {
  try {
    const res = await axios.get<ArrayBuffer>(url, { responseType: 'arraybuffer', timeout: 15000 });
    const base64 = Buffer.from(res.data).toString('base64');
    const mimeType = (res.headers['content-type'] as string) || 'image/png';
    return { base64, mimeType };
  } catch {
    return null;
  }
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9가-힣_-]/g, '').slice(0, 30);
}

export const ImageService = {
  async generateCharacter(req: CharacterImageRequest): Promise<string> {
    const { character, artStyle, settings, storybookId, storybookTitle } = req;
    const prompt = buildCharacterPrompt(character, artStyle, settings?.aspectRatio ?? '1:1');

    const base64 = await generateImageWithGemini({ prompt });
    const key = `${storybookId}-${sanitizeFilename(storybookTitle)}-character-${sanitizeFilename(character.name)}-${Date.now()}.png`;
    return R2Repository.uploadImage(base64, key);
  },

  async generateIllustration(req: IllustrationRequest): Promise<string> {
    const { page, artStyle, characterReferences, settings, storybookId, storybookTitle } = req;

    const refImages = (
      await Promise.all(
        characterReferences
          .filter((c) => c.referenceImage)
          .map((c) => urlToBase64(c.referenceImage!))
      )
    ).filter(Boolean) as Array<{ base64: string; mimeType: string }>;

    const prompt = buildIllustrationPrompt(
      page,
      artStyle,
      characterReferences,
      settings?.aspectRatio ?? '16:9'
    );

    const base64 = await generateImageWithGemini({ prompt, referenceImages: refImages });
    const key = `${storybookId}-${sanitizeFilename(storybookTitle)}-illustration-page${page.pageNumber}-${Date.now()}.png`;
    return R2Repository.uploadImage(base64, key);
  },

  async generateCover(req: CoverRequest): Promise<string> {
    const { storybook, characterReferences, settings } = req;

    const refImages = (
      await Promise.all(
        characterReferences
          .filter((c) => c.referenceImage)
          .map((c) => urlToBase64(c.referenceImage!))
      )
    ).filter(Boolean) as Array<{ base64: string; mimeType: string }>;

    const prompt = buildCoverPrompt(storybook, settings?.aspectRatio ?? '3:4');
    const base64 = await generateImageWithGemini({ prompt, referenceImages: refImages });
    const key = `cover-${sanitizeFilename(storybook.title)}-${Date.now()}.png`;
    return R2Repository.uploadImage(base64, key);
  },

  async generateKeyObject(req: KeyObjectRequest): Promise<string> {
    const { keyObject, artStyle, storybookId, storybookTitle } = req;
    const prompt = buildKeyObjectPrompt(keyObject, artStyle);

    const base64 = await generateImageWithGemini({ prompt });
    const key = `${storybookId}-${sanitizeFilename(storybookTitle)}-keyobj-${sanitizeFilename(keyObject.name)}-${Date.now()}.png`;
    return R2Repository.uploadImage(base64, key);
  },

  async generateVocabulary(req: VocabularyRequest) {
    const { vocabularyItems, artStyle, storybookId, storybookTitle } = req;

    const results = await Promise.allSettled(
      vocabularyItems.map(async (item) => {
        const prompt = `Create a clear, educational illustration of "${item.word}" (${item.korean}) for children aged 4-8. ${artStyle} style. Clean white background. No text in the image.`;
        const base64 = await generateImageWithGemini({ prompt });
        const key = `${storybookId}-${sanitizeFilename(storybookTitle)}-vocab-${sanitizeFilename(item.word)}-${Date.now()}.png`;
        const imageUrl = await R2Repository.uploadImage(base64, key);
        return { word: item.word, korean: item.korean, imageUrl, success: true };
      })
    );

    return results.map((r, i) =>
      r.status === 'fulfilled'
        ? r.value
        : {
            word: vocabularyItems[i].word,
            korean: vocabularyItems[i].korean,
            imageUrl: '',
            success: false,
          }
    );
  },

  async deleteImage(imageUrl: string): Promise<void> {
    await R2Repository.deleteImage(imageUrl);
  },

  async uploadImage(file: Express.Multer.File, body: Record<string, string>): Promise<string> {
    const { storybookId, storybookTitle, type, characterName, pageNumber } = body;
    const ext = file.originalname.split('.').pop() ?? 'png';
    const typePart = type ?? 'upload';
    const namePart = characterName ?? (pageNumber ? `page${pageNumber}` : 'misc');
    const key = `${storybookId}-${sanitizeFilename(storybookTitle ?? '')}-${typePart}-${sanitizeFilename(namePart)}-${Date.now()}.${ext}`;
    return R2Repository.uploadBuffer(file.buffer, key, file.mimetype);
  },
};

// --- 프롬프트 빌더 ---

function buildCharacterPrompt(char: Character, artStyle: string, aspectRatio: string): string {
  return `Create a professional character design reference sheet for a children's storybook.

Character Name: ${char.name}
Character Description: ${char.description}
Age: ${char.age ?? 'unknown'}
Art Style: ${artStyle}
Aspect Ratio: ${aspectRatio}

Layout: Show the character in multiple views in a single image:
- Front view (center, main pose)
- Side view (left)
- 3/4 view (right)
- Three facial expressions at the bottom: happy, surprised, neutral

Background: Clean white background.
Quality: High detail, vibrant colors, professional children's book illustration.

CRITICAL - NO TEXT: Do NOT include any text, labels, or captions. Pure illustration only.`;
}

function buildIllustrationPrompt(
  page: Page,
  artStyle: string,
  chars: Array<Character & { referenceImage?: string }>,
  aspectRatio: string
): string {
  const charList = chars.map((c) => `- ${c.name} (height: ${c.height}px)`).join('\n');
  return `Create a storybook illustration for children.

Scene: ${page.scene_description}
Characters & Actions: ${page.scene_structure.characters}
Background: ${page.scene_structure.background}
Atmosphere: ${page.scene_structure.atmosphere}

Art Style: ${artStyle}
Aspect Ratio: ${aspectRatio}

Characters present (match EXACTLY to reference images):
${charList}

${page.customModifications ? `Additional requirements: ${page.customModifications}` : ''}

CRITICAL - NO TEXT: No text, speech bubbles, or labels in the image.`;
}

function buildCoverPrompt(
  storybook: { title: string; coverPrompt?: string; artStyle: string },
  aspectRatio: string
): string {
  return `Create a beautiful children's book cover illustration.

Book Title: ${storybook.title}
${storybook.coverPrompt ? `Cover Description: ${storybook.coverPrompt}` : ''}
Art Style: ${storybook.artStyle}
Aspect Ratio: ${aspectRatio}

Quality: Professional children's book cover, vibrant and eye-catching.
CRITICAL - NO TEXT: No text, title, or labels in the image.`;
}

function buildKeyObjectPrompt(obj: KeyObject, artStyle: string): string {
  return `Create a clear educational illustration of an object for a children's storybook.

Object: ${obj.name}
Description: ${obj.description}
Art Style: ${artStyle}

Style: Clean, simple, educational illustration. White or transparent background.
CRITICAL - NO TEXT: No text or labels in the image.`;
}
