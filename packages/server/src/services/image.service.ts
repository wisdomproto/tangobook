import axios from 'axios';
import { generateImageWithGemini, getTextModel } from '../providers/gemini.provider.js';
import { R2Repository } from '../repositories/r2.repository.js';
import type { Character, Page, KeyObject, VocabularyItem } from '@tangobook/shared';

interface ImageSettings {
  aspectRatio?: string;
  enforceNoText?: boolean;
}

// 모든 삽화/표지/캐릭터 이미지 생성에 공통 적용되는 system instruction
const IMAGE_SYSTEM_INSTRUCTION = `You are a professional children's book illustrator AI.

ABSOLUTE RULE:
- NEVER include any text, letters, numbers, words, labels, captions, speech bubbles, or watermarks in the image. This is the most critical rule.

CHARACTER CONSISTENCY:
- When reference images are provided, match character appearances EXACTLY: clothing, hair color/style, body proportions, skin tone, accessories.
- Maintain each character's height ratio relative to other characters and objects across all pages. If a character is tall, they must remain tall in every scene.
- Characters' facial features and body build must stay consistent throughout the entire book.

ART STYLE CONSISTENCY:
- Maintain the SAME art style, color palette, line weight, and rendering technique across all pages.
- Color grading and saturation level must remain consistent within the same book.
- Brush stroke style (if watercolor/oil) or line art style (if cartoon/illustration) must not change between pages.

SCENE & SPATIAL CONSISTENCY:
- If a previous page's illustration is provided as reference, maintain spatial consistency: objects and landmarks that appeared on one side should remain on the same side in subsequent scenes of the same location.
- Day/night, weather, and lighting must clearly match the scene description. Daytime scenes must have bright natural light; nighttime scenes must have moonlight/darkness/artificial light. Do not mix them.
- Indoor/outdoor settings must be clearly distinguished with appropriate lighting and atmosphere.

OBJECT & SCALE CONSISTENCY:
- Objects (buildings, trees, furniture, props) must maintain consistent size relative to characters across all pages.
- Key story objects (e.g., a magic mirror, a poisoned apple) must look identical every time they appear.
- Real-world scale relationships must be respected: a house is bigger than a person, a flower is smaller than a child's hand.

COMPOSITION:
- Compositions should be clear and easy for young children (ages 4-8) to understand.
- Use child-friendly, warm, and inviting visual aesthetics.
- Characters should have expressive faces with clear, readable emotions.
- Colors should be vibrant but harmonious.
- Backgrounds should be detailed but not cluttered, supporting the main scene focus.
- Avoid any scary, violent, or inappropriate content for children.`;

interface CharacterImageRequest {
  character: Character;
  artStyle: string;
  settings?: ImageSettings;
  storybookId: string;
  storybookTitle: string;
  currentImageUrl?: string;
  model?: string;
}

interface IllustrationRequest {
  page: Page;
  artStyle: string;
  characterReferences: Array<Character & { imageUrl?: string }>;
  previousIllustrationUrl?: string;
  currentImageUrl?: string;
  settings?: ImageSettings;
  storybookId: string;
  storybookTitle: string;
  model?: string;
}

interface CoverRequest {
  storybook: { title: string; coverPrompt?: string; artStyle: string };
  characterReferences: Array<Character & { referenceImage?: string }>;
  settings?: ImageSettings;
  currentImageUrl?: string;
  model?: string;
}

interface KeyObjectRequest {
  keyObject: KeyObject;
  artStyle: string;
  storybookId: string;
  storybookTitle: string;
  currentImageUrl?: string;
  model?: string;
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
    const { character, artStyle, settings, storybookId, storybookTitle, currentImageUrl, model } =
      req;
    const prompt = buildCharacterPrompt(character, artStyle, settings?.aspectRatio ?? '1:1');

    const refImages: Array<{ base64: string; mimeType: string }> = [];
    if (currentImageUrl) {
      const img = await urlToBase64(currentImageUrl);
      if (img) refImages.push(img);
    }

    const base64 = await generateImageWithGemini({
      prompt: currentImageUrl
        ? `${prompt}\n\nREFERENCE: A reference image of this character is provided. Use it to maintain visual consistency while applying the new prompt instructions.`
        : prompt,
      referenceImages: refImages,
      systemInstruction: IMAGE_SYSTEM_INSTRUCTION,
      model,
    });
    const key = `${storybookId}-${sanitizeFilename(storybookTitle)}-character-${sanitizeFilename(character.name)}-${Date.now()}.png`;
    return R2Repository.uploadImage(base64, key);
  },

  async generateIllustration(req: IllustrationRequest): Promise<string> {
    const {
      page,
      artStyle,
      characterReferences,
      previousIllustrationUrl,
      currentImageUrl,
      settings,
      storybookId,
      storybookTitle,
      model,
    } = req;

    // Filter character references to only those mentioned in this page's context
    const pageContext = [
      page.text ?? '',
      page.scene_description ?? '',
      page.scene_structure?.characters ?? '',
    ].join(' ');
    const relevantChars = characterReferences.filter((c) => pageContext.includes(c.name));

    const charRefPromises = relevantChars
      .filter((c) => c.referenceImage)
      .map((c) => urlToBase64(c.referenceImage!));

    const prevIllPromise = previousIllustrationUrl
      ? urlToBase64(previousIllustrationUrl)
      : Promise.resolve(null);

    const currentIllPromise = currentImageUrl
      ? urlToBase64(currentImageUrl)
      : Promise.resolve(null);

    const [charRefs, prevIll, currentIll] = await Promise.all([
      Promise.all(charRefPromises),
      prevIllPromise,
      currentIllPromise,
    ]);

    const refImages = charRefs.filter(Boolean) as Array<{ base64: string; mimeType: string }>;
    if (prevIll) refImages.push(prevIll);
    if (currentIll) refImages.push(currentIll);

    let prompt = buildIllustrationPrompt(
      page,
      artStyle,
      relevantChars,
      settings?.aspectRatio ?? '16:9',
      !!prevIll
    );
    if (currentIll) {
      prompt += `\n\nCURRENT IMAGE REFERENCE: The last reference image is the current illustration for this page. Use it as a style and composition reference while applying the updated prompt.`;
    }

    const aspectRatio = settings?.aspectRatio ?? '16:9';
    const base64 = await generateImageWithGemini({
      prompt,
      referenceImages: refImages,
      systemInstruction: IMAGE_SYSTEM_INSTRUCTION,
      aspectRatio,
      model,
    });
    const key = `${storybookId}-${sanitizeFilename(storybookTitle)}-illustration-page${page.pageNumber}-${Date.now()}.png`;
    return R2Repository.uploadImage(base64, key);
  },

  async generateCover(req: CoverRequest): Promise<string> {
    const { storybook, characterReferences, settings, currentImageUrl, model } = req;

    const refImages = (
      await Promise.all(
        characterReferences
          .filter((c) => c.referenceImage)
          .map((c) => urlToBase64(c.referenceImage!))
      )
    ).filter(Boolean) as Array<{ base64: string; mimeType: string }>;

    if (currentImageUrl) {
      const img = await urlToBase64(currentImageUrl);
      if (img) refImages.push(img);
    }

    const aspectRatio = settings?.aspectRatio ?? '3:4';
    const prompt = buildCoverPrompt(storybook, aspectRatio);
    const base64 = await generateImageWithGemini({
      prompt: currentImageUrl
        ? `${prompt}\n\nREFERENCE: The last reference image is the current cover. Use it as a style and composition reference while applying the new prompt.`
        : prompt,
      referenceImages: refImages,
      systemInstruction: IMAGE_SYSTEM_INSTRUCTION,
      aspectRatio,
      model,
    });
    const key = `cover-${sanitizeFilename(storybook.title)}-${Date.now()}.png`;
    return R2Repository.uploadImage(base64, key);
  },

  async generateKeyObject(req: KeyObjectRequest): Promise<string> {
    const { keyObject, artStyle, storybookId, storybookTitle, currentImageUrl, model } = req;
    const prompt = buildKeyObjectPrompt(keyObject, artStyle);

    const refImages: Array<{ base64: string; mimeType: string }> = [];
    if (currentImageUrl) {
      const img = await urlToBase64(currentImageUrl);
      if (img) refImages.push(img);
    }

    const base64 = await generateImageWithGemini({
      prompt: currentImageUrl
        ? `${prompt}\n\nREFERENCE: A reference image of this object is provided. Use it to maintain visual consistency while applying the new prompt.`
        : prompt,
      referenceImages: refImages,
      systemInstruction: IMAGE_SYSTEM_INSTRUCTION,
      model,
    });
    const key = `${storybookId}-${sanitizeFilename(storybookTitle)}-keyobj-${sanitizeFilename(keyObject.name)}-${Date.now()}.png`;
    return R2Repository.uploadImage(base64, key);
  },

  async generateVocabulary(req: VocabularyRequest) {
    const { vocabularyItems, artStyle, storybookId, storybookTitle } = req;

    const results = await Promise.allSettled(
      vocabularyItems.map(async (item) => {
        const prompt = `Create a clear, educational illustration of "${item.word}" (${item.korean}) for children aged 4-8.

*** MANDATORY ART STYLE (MUST FOLLOW EXACTLY) ***
${artStyle}
*** END ART STYLE ***
The entire illustration MUST be rendered strictly in the art style described above. Do NOT default to generic cartoon or digital art style.

Clean white background. No text in the image.`;
        const base64 = await generateImageWithGemini({
          prompt,
          systemInstruction: IMAGE_SYSTEM_INSTRUCTION,
        });
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

  async analyzeArtStyle(file: Express.Multer.File): Promise<string> {
    const base64 = file.buffer.toString('base64');
    const mimeType = file.mimetype as 'image/png' | 'image/jpeg' | 'image/webp';

    const result = await getTextModel().generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { data: base64, mimeType } },
            {
              text: `Analyze this image's art style in detail. Describe the style in English as a concise prompt that could be used to generate images in the same style. Include: medium (watercolor, digital, oil painting, etc.), color palette, line style, texture, mood, and any distinctive characteristics. Output ONLY the style description prompt, nothing else.`,
            },
          ],
        },
      ],
    });

    return result.response.text().trim();
  },

  async uploadAudio(file: Express.Multer.File, body: Record<string, string>): Promise<string> {
    const { storybookId, storybookTitle } = body;
    const ext = file.originalname.split('.').pop() ?? 'mp3';
    const key = `${storybookId ?? 'shared'}-${sanitizeFilename(storybookTitle ?? '')}-bgm-${Date.now()}.${ext}`;
    return R2Repository.uploadBuffer(file.buffer, key, file.mimetype);
  },

  async getBgmList(): Promise<
    Array<{ id: string; title: string; url: string; createdAt: string }>
  > {
    try {
      const res = await axios.get<
        Array<{ id: string; title: string; url: string; createdAt: string }>
      >('https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/background-music.json', {
        timeout: 10000,
      });
      return res.data;
    } catch {
      return [];
    }
  },
};

// --- 프롬프트 빌더 ---

function buildCharacterPrompt(char: Character, artStyle: string, aspectRatio: string): string {
  const heightInfo = char.heightCm
    ? `\nReal-world Height: approximately ${char.heightCm}cm. Draw body proportions appropriate for this height.`
    : '';
  return `Create a professional character design reference sheet for a children's storybook.

Character Name: ${char.name}
Character Description: ${char.description}
Age: ${char.age ?? 'unknown'}${heightInfo}
Relative Height Scale: ${char.height}/200 (used for sizing relative to other characters)
Aspect Ratio: ${aspectRatio}

*** MANDATORY ART STYLE (MUST FOLLOW EXACTLY) ***
${artStyle}
*** END ART STYLE ***
The entire illustration MUST be rendered strictly in the art style described above. Every element — line work, coloring technique, texture, shading, and overall aesthetic — must match this style precisely. Do NOT default to generic cartoon or digital art style.

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
  aspectRatio: string,
  hasPreviousIllustration = false
): string {
  const charList = chars
    .map((c) => {
      const cm = (c as Character & { heightCm?: number }).heightCm;
      return `- ${c.name} (relative height: ${c.height}/200${cm ? `, ~${cm}cm tall` : ''})`;
    })
    .join('\n');

  const prevRef = hasPreviousIllustration
    ? `\nPREVIOUS PAGE REFERENCE: The last reference image is the previous page's illustration. Use it to maintain visual continuity:
- Keep the same art style, color palette, and rendering technique.
- If the scene is in the same location, maintain spatial layout (object positions, left/right orientation).
- Maintain consistent day/night lighting and weather conditions unless the scene explicitly changes.
- Keep character proportions and object sizes consistent with the previous page.\n`
    : '';

  return `Create a storybook illustration for children.

Scene: ${page.scene_description}
Characters & Actions: ${page.scene_structure.characters}
Background: ${page.scene_structure.background}
Atmosphere: ${page.scene_structure.atmosphere}
Aspect Ratio: ${aspectRatio}

*** MANDATORY ART STYLE (MUST FOLLOW EXACTLY) ***
${artStyle}
*** END ART STYLE ***
The entire illustration MUST be rendered strictly in the art style described above. Every element — line work, coloring technique, texture, shading, and overall aesthetic — must match this style precisely. Do NOT default to generic cartoon or digital art style.

Characters present (match EXACTLY to reference images):
${charList}
${prevRef}
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
Aspect Ratio: ${aspectRatio}

*** MANDATORY ART STYLE (MUST FOLLOW EXACTLY) ***
${storybook.artStyle}
*** END ART STYLE ***
The entire illustration MUST be rendered strictly in the art style described above. Every element — line work, coloring technique, texture, shading, and overall aesthetic — must match this style precisely. Do NOT default to generic cartoon or digital art style.

Quality: Professional children's book cover, vibrant and eye-catching.
CRITICAL - NO TEXT: No text, title, or labels in the image.`;
}

function buildKeyObjectPrompt(obj: KeyObject, artStyle: string): string {
  const sizeInfo = obj.sizeCm
    ? `\nReal-world Size: approximately ${obj.sizeCm}cm (${obj.sizeCategory ?? 'medium'}). Draw the object at proportions that reflect this real-world size.`
    : obj.sizeCategory
      ? `\nSize Category: ${obj.sizeCategory}. Draw the object at proportions appropriate for a ${obj.sizeCategory}-sized object.`
      : '';
  return `Create a clear educational illustration of an object for a children's storybook.

Object: ${obj.name}${obj.korean ? ` (${obj.korean})` : ''}
Description: ${obj.description}${sizeInfo}

*** MANDATORY ART STYLE (MUST FOLLOW EXACTLY) ***
${artStyle}
*** END ART STYLE ***
The entire illustration MUST be rendered strictly in the art style described above. Every element — line work, coloring technique, texture, shading, and overall aesthetic — must match this style precisely. Do NOT default to generic cartoon or digital art style.

White or transparent background.
CRITICAL - NO TEXT: No text or labels in the image.`;
}
