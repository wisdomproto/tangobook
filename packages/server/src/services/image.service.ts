import axios from 'axios';
import { generateImageWithGemini, getTextModel } from '../providers/gemini.provider.js';
import { R2Repository } from '../repositories/r2.repository.js';
import { buildR2Key } from '../utils/r2-key.js';
import { uploadJsonToR2, deleteFromR2, urlToR2Key } from '../providers/r2.provider.js';
import { AppError } from '../middleware/error.middleware.js';
import type {
  Character,
  Page,
  KeyObject,
  VocabularyItem,
  PhonicsFlashcard,
} from '@tangobook/shared';

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

COPYRIGHT AVOIDANCE:
- NEVER reproduce copyrighted character designs (Disney, Pixar, Ghibli, etc.).
- If character descriptions evoke a well-known IP, reinterpret with original designs: change hair color, outfit style, and accessories to be distinctly different.
- Avoid iconic visual combinations associated with specific franchises (e.g., blonde hair + blue gown + glass slippers, black-haired girl + yellow/blue dress + red headband).
- Create original, unique character appearances inspired by the fairy tale's cultural setting, not by any specific movie or animation adaptation.

COMPOSITION:
- Compositions should be clear and easy for young children (ages 4-8) to understand.
- Use child-friendly, warm, and inviting visual aesthetics.
- Characters should have expressive faces with clear, readable emotions.
- Colors should be vibrant but harmonious.
- Backgrounds should be detailed but not cluttered, supporting the main scene focus.
- Avoid any scary, violent, or inappropriate content for children.`;

// 표지 이미지 전용 system instruction (제목 텍스트 허용)
const COVER_SYSTEM_INSTRUCTION = IMAGE_SYSTEM_INSTRUCTION.replace(
  'ABSOLUTE RULE:\n- NEVER include any text, letters, numbers, words, labels, captions, speech bubbles, or watermarks in the image. This is the most critical rule.',
  `COVER TITLE RULE:
- The book title text MUST be included prominently on the cover. Use decorative, child-friendly typography that matches the art style.
- Position the title for maximum visual impact (typically upper area).
- NEVER include any other text besides the book title — no subtitles, author names, labels, captions, speech bubbles, or watermarks.`
);

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
  flashcardImageRefs?: Array<{ word: string; imageUrl: string }>;
}

interface CoverRequest {
  storybook: { title: string; coverPrompt?: string; artStyle: string };
  characterReferences: Array<Character & { referenceImage?: string }>;
  settings?: ImageSettings;
  currentImageUrl?: string;
  model?: string;
  phonicsCover?: {
    titleText: string;
    blendingWords: string[];
    characters: string[];
  };
  titleTemplateUrl?: string;
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

interface PhonicsWordImageRequest {
  word: string;
  description?: string;
  artStyle: string;
  storybookId: string;
  storybookTitle: string;
  isolatedObject?: boolean;
  model?: string;
  aspectRatio?: string;
  characterReferences?: Array<{
    name: string;
    description?: string;
    descriptionEn?: string;
    referenceImage?: string;
  }>;
}

interface PhonicsFlashcardImageRequest {
  flashcards: PhonicsFlashcard[];
  artStyle: string;
  storybookId: string;
  storybookTitle: string;
  model?: string;
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

export const ImageService = {
  async generateCharacter(req: CharacterImageRequest): Promise<string> {
    const { character, artStyle, settings, storybookId, storybookTitle, currentImageUrl, model } =
      req;
    const alias = `Character ${character.role === '주인공' ? 'Main' : 'Side'}`;
    const prompt = buildCharacterPrompt(character, artStyle, settings?.aspectRatio ?? '1:1', alias);

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
    const key = buildR2Key({
      storybookId,
      storybookTitle,
      fileType: 'character',
      identifier: character.name,
      extension: 'webp',
    });
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
      flashcardImageRefs,
    } = req;

    // Filter character references to only those mentioned in this page's context
    // 한글 + 영어 양쪽 컨텍스트에서 대소문자 무시하여 매칭
    const pageContextKo = [
      page.text ?? '',
      page.scene_description ?? '',
      page.scene_structure?.characters ?? '',
    ]
      .join(' ')
      .toLowerCase();
    const pageContextEn = [
      page.scene_description_en ?? '',
      page.scene_structure?.characters_en ?? '',
    ]
      .join(' ')
      .toLowerCase();
    const relevantChars = characterReferences.filter((c) => {
      const name = c.name.toLowerCase();
      return pageContextKo.includes(name) || pageContextEn.includes(name);
    });

    const charRefPromises = relevantChars
      .filter((c) => c.referenceImage)
      .map((c) => urlToBase64(c.referenceImage!));

    // 핵심단어 이미지 레퍼런스 로딩
    const fcRefPromises = (flashcardImageRefs ?? []).map((fc) => urlToBase64(fc.imageUrl));

    const prevIllPromise = previousIllustrationUrl
      ? urlToBase64(previousIllustrationUrl)
      : Promise.resolve(null);

    const currentIllPromise = currentImageUrl
      ? urlToBase64(currentImageUrl)
      : Promise.resolve(null);

    const [charRefs, fcRefs, prevIll, currentIll] = await Promise.all([
      Promise.all(charRefPromises),
      Promise.all(fcRefPromises),
      prevIllPromise,
      currentIllPromise,
    ]);

    // 순서: 캐릭터 → 핵심단어 이미지 → 이전 페이지 → 현재 페이지
    const refImages = charRefs.filter(Boolean) as Array<{ base64: string; mimeType: string }>;
    const validFcRefs = fcRefs.filter(Boolean) as Array<{ base64: string; mimeType: string }>;
    refImages.push(...validFcRefs);
    if (prevIll) refImages.push(prevIll);
    if (currentIll) refImages.push(currentIll);

    const fcWords =
      validFcRefs.length > 0
        ? (flashcardImageRefs ?? []).filter((_, i) => fcRefs[i]).map((fc) => fc.word)
        : [];

    const aliasMap = buildCharacterAliasMap(relevantChars);
    let prompt = buildIllustrationPrompt(
      page,
      artStyle,
      relevantChars,
      settings?.aspectRatio ?? '16:9',
      !!prevIll,
      aliasMap,
      fcWords
    );
    if (currentIll) {
      prompt += `\n\nCURRENT IMAGE REFERENCE: The last reference image is the current illustration for this page. Use it ONLY for layout/composition (camera angle, character positions, scene framing, background elements). DO NOT copy character appearance from this image — character designs (face, hair, outfit, body proportions) MUST follow the earlier character reference images exactly. If the current illustration shows characters that look different from the character references, ignore those visual designs and replace them with the character references as the source of truth.`;
    }

    const aspectRatio = settings?.aspectRatio ?? '16:9';
    const base64 = await generateImageWithGemini({
      prompt,
      referenceImages: refImages,
      systemInstruction: IMAGE_SYSTEM_INSTRUCTION,
      aspectRatio,
      model,
    });
    const key = buildR2Key({
      storybookId,
      storybookTitle,
      fileType: 'illustration',
      identifier: `page${page.pageNumber}`,
      extension: 'webp',
    });
    return R2Repository.uploadImage(base64, key);
  },

  async generateCover(req: CoverRequest): Promise<string> {
    const {
      storybook,
      characterReferences,
      settings,
      currentImageUrl,
      model,
      phonicsCover,
      titleTemplateUrl,
    } = req;

    const refImages = (
      await Promise.all(
        characterReferences
          .filter((c) => c.referenceImage)
          .map((c) => urlToBase64(c.referenceImage!))
      )
    ).filter(Boolean) as Array<{ base64: string; mimeType: string }>;

    // 제목 템플릿 이미지 → refImages 맨 앞에 삽입
    const hasTitleTemplate = !!titleTemplateUrl;
    if (titleTemplateUrl) {
      const tplImg = await urlToBase64(titleTemplateUrl);
      if (tplImg) refImages.unshift(tplImg);
    }

    if (currentImageUrl) {
      const img = await urlToBase64(currentImageUrl);
      if (img) refImages.push(img);
    }

    const coverAliasMap = buildCharacterAliasMap(characterReferences);
    const aspectRatio = settings?.aspectRatio ?? '3:4';
    const prompt = phonicsCover
      ? buildPhonicsCoverPrompt(
          storybook,
          phonicsCover,
          aspectRatio,
          coverAliasMap,
          hasTitleTemplate
        )
      : buildCoverPrompt(storybook, aspectRatio, coverAliasMap, hasTitleTemplate);
    const base64 = await generateImageWithGemini({
      prompt: currentImageUrl
        ? `${prompt}\n\nREFERENCE: The last reference image is the current cover. Use it as a style and composition reference while applying the new prompt.`
        : prompt,
      referenceImages: refImages,
      systemInstruction: COVER_SYSTEM_INSTRUCTION,
      aspectRatio,
      model,
    });
    const key = buildR2Key({
      storybookTitle: storybook.title,
      fileType: 'cover',
      extension: 'webp',
    });
    return R2Repository.uploadImage(base64, key);
  },

  /**
   * 어휘 단원 단어 이미지 생성 — KeyObject 패턴 응용. R2 prefix 만 다름.
   * 단어 1개 = N 장 (호출 시마다 array 에 append).
   */
  async generateVocabularyUnitWord(req: {
    word: string;
    korean?: string;
    description?: string;
    customPrompt?: string;
    unitId: string;
    artStyle?: string;
    currentImageUrl?: string;
    model?: string;
  }): Promise<string> {
    const { word, korean, description, customPrompt, unitId, artStyle, currentImageUrl, model } =
      req;
    const styleBlock = artStyle ? artStyleBlock(artStyle) : '';
    const hasCustom = !!customPrompt;
    const koHint = korean ? ` (${korean})` : '';
    const descLine = description ? `Description: ${description}` : '';
    const prompt = `${isolatedObjectPrompt(word, hasCustom)}
${hasCustom ? `\n구체적 묘사: ${customPrompt}` : ''}
Word: ${word}${koHint}
${descLine}

${styleBlock}`;

    const refImages: Array<{ base64: string; mimeType: string }> = [];
    if (currentImageUrl) {
      const img = await urlToBase64(currentImageUrl);
      if (img) refImages.push(img);
    }

    const base64 = await generateImageWithGemini({
      prompt: currentImageUrl
        ? `${prompt}\n\nREFERENCE: A reference image is provided. Use it for style/composition while applying the new prompt.`
        : prompt,
      referenceImages: refImages,
      systemInstruction: IMAGE_SYSTEM_INSTRUCTION,
      model,
    });
    // R2 key: vocabulary-units/{unitId}/{word}-{ts}.webp
    const safeWord = word
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]/g, '-')
      .slice(0, 30);
    const key = `vocabulary-units/${unitId}/${safeWord}-${Date.now()}.webp`;
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
    const key = buildR2Key({
      storybookId,
      storybookTitle,
      fileType: 'keyobj',
      identifier: keyObject.name,
      extension: 'webp',
    });
    return R2Repository.uploadImage(base64, key);
  },

  async generateHiddenObjectScene(req: {
    storybookId: string;
    storybookTitle: string;
    artStyle: string;
    theme?: string;
    objects: { name: string; imageUrl?: string }[];
    model?: string;
  }): Promise<string> {
    const { storybookId, storybookTitle, artStyle, theme, objects, model } = req;
    if (objects.length === 0) {
      throw new AppError(400, '숨길 사물을 1개 이상 선택해주세요.');
    }

    const objectNames = objects.map((o) => o.name).join(', ');
    const themeLine = theme?.trim()
      ? `Scene setting: ${theme.trim()}.`
      : 'Scene setting: a rich, child-friendly environment that fits these objects.';

    const prompt = `Draw a single busy "hidden object" / "I Spy" scene in this art style: ${artStyle}.
${themeLine}
Naturally place and partially camouflage ALL of the following objects throughout the scene so a young child can find them by looking carefully: ${objectNames}.
The objects must be recognizable but blended into the environment (behind, beside, or among other elements) — not floating or pasted.
The scene should be visually rich but readable for ages 4-7. No text, letters, numbers, or labels anywhere.
Aspect ratio 16:9, horizontal composition.`;

    const refImages: Array<{ base64: string; mimeType: string }> = [];
    for (const obj of objects.slice(0, 6)) {
      if (!obj.imageUrl) continue;
      const img = await urlToBase64(obj.imageUrl);
      if (img) refImages.push(img);
    }

    const base64 = await generateImageWithGemini({
      prompt:
        refImages.length > 0
          ? `${prompt}\n\nREFERENCE: Images of the objects to hide are provided. Match their identity and the book's art style exactly.`
          : prompt,
      referenceImages: refImages,
      systemInstruction: IMAGE_SYSTEM_INSTRUCTION,
      aspectRatio: '16:9',
      model,
    });

    const key = buildR2Key({
      storybookId,
      storybookTitle,
      fileType: 'hiddenobj',
      identifier: `scene-${Date.now()}`,
      extension: 'webp',
    });
    return R2Repository.uploadImage(base64, key);
  },

  async generateVocabulary(req: VocabularyRequest) {
    const { vocabularyItems, artStyle, storybookId, storybookTitle } = req;

    const results = await Promise.allSettled(
      vocabularyItems.map(async (item) => {
        const prompt = `Create a clear, educational illustration of "${item.word}" (${item.korean}) for children aged 4-8.

${artStyleBlock(artStyle)}

Clean white background. No text in the image.`;
        const base64 = await generateImageWithGemini({
          prompt,
          systemInstruction: IMAGE_SYSTEM_INSTRUCTION,
        });
        const key = buildR2Key({
          storybookId,
          storybookTitle,
          fileType: 'vocab',
          identifier: item.word,
          extension: 'webp',
        });
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

  async generatePhonicsWord(req: PhonicsWordImageRequest): Promise<string> {
    const {
      word,
      description,
      artStyle,
      storybookId,
      storybookTitle,
      model,
      aspectRatio,
      characterReferences,
      isolatedObject,
    } = req;
    const ratio = aspectRatio ?? '16:9';
    // isolatedObject: 어휘 플래시카드 — 장면 설명·캐릭터 레퍼런스 제외, 대상만 단독 렌더
    if (isolatedObject) {
      const descHint = description ? `\n구체적 묘사: ${description}` : '';
      const prompt = `"${word}"를 주제로 4-8세 아이를 위한 선명하고 교육적인 삽화를 그려주세요.${descHint}
Aspect Ratio: ${ratio}

${artStyleBlock(artStyle, 'ko')}

${isolatedObjectPrompt(word, !!description)}`;

      const base64 = await generateImageWithGemini({
        prompt,
        systemInstruction: IMAGE_SYSTEM_INSTRUCTION,
        aspectRatio: ratio,
        model,
      });
      const key = buildR2Key({
        storybookId,
        storybookTitle,
        fileType: 'phonics',
        identifier: word,
        extension: 'webp',
      });
      return R2Repository.uploadImage(base64, key);
    }

    // 비-isolated: 장면 설명 + 캐릭터 레퍼런스 항상 포함
    const descLine = description ? `\n장면: ${description}` : '';

    const chars = characterReferences ?? [];
    const charDescriptions = chars
      .map((c) => `- ${c.name}: ${c.descriptionEn ?? c.description ?? ''}`)
      .filter((line) => line.length > 5)
      .join('\n');

    const charRefSection =
      charDescriptions.length > 0
        ? `\n\n*** 캐릭터 레퍼런스 ***\n이 동화책에 등장하는 캐릭터입니다. 장면 설명의 캐릭터는 아래 설명과 첨부된 레퍼런스 이미지대로 정확히 그려주세요:\n${charDescriptions}\n*** 캐릭터 레퍼런스 끝 ***`
        : '';

    const hasChars = charDescriptions.length > 0;
    const prompt = `4-8세 유아용 파닉스 교재의 학습카드 장면 삽화를 그려주세요.${descLine}${charRefSection}
Aspect Ratio: ${ratio}

${artStyleBlock(artStyle, 'ko')}

${
  hasChars
    ? `*** 중요: 캐릭터 일관성 ***
첨부된 캐릭터 레퍼런스 이미지를 반드시 참고하여, 캐릭터의 외모(옷, 머리색, 체형, 얼굴 특징)를 정확히 일치시키세요. 장면 설명에 캐릭터가 등장하면 레퍼런스와 동일한 모습으로 그려야 합니다.
*** 캐릭터 일관성 끝 ***

`
    : ''
}장면 설명대로 캐릭터와 사물이 자연스럽게 상호작용하는 풍부한 장면을 그려주세요. 구체적인 배경(공원, 숲, 마당 등)을 포함하고 밝고 따뜻한 분위기로 표현하세요. 이미지에 텍스트, 글자, 라벨을 포함하지 마세요.`;

    // 캐릭터 레퍼런스 이미지 항상 로딩
    const refImages = (
      await Promise.all(
        chars.filter((c) => c.referenceImage).map((c) => urlToBase64(c.referenceImage!))
      )
    ).filter(Boolean) as Array<{ base64: string; mimeType: string }>;

    const base64 = await generateImageWithGemini({
      prompt,
      referenceImages: refImages.length > 0 ? refImages : undefined,
      systemInstruction: IMAGE_SYSTEM_INSTRUCTION,
      aspectRatio: ratio,
      model,
    });
    const key = buildR2Key({
      storybookId,
      storybookTitle,
      fileType: 'phonics',
      identifier: word,
      extension: 'webp',
    });
    return R2Repository.uploadImage(base64, key);
  },

  async generatePhonicsFlashcards(req: PhonicsFlashcardImageRequest) {
    const { flashcards, artStyle, storybookId, storybookTitle, model } = req;

    const results = await Promise.allSettled(
      flashcards.map(async (card) => {
        const prompt = `"${card.word}" (${card.localWord})를 주제로 4-8세 아이를 위한 선명하고 교육적인 삽화를 그려주세요.

${artStyleBlock(artStyle, 'ko')}

${isolatedObjectPrompt(card.word)}`;

        const base64 = await generateImageWithGemini({
          prompt,
          systemInstruction: IMAGE_SYSTEM_INSTRUCTION,
          model,
        });
        const key = buildR2Key({
          storybookId,
          storybookTitle,
          fileType: 'phonics-fc',
          identifier: card.word,
          extension: 'webp',
        });
        const imageUrl = await R2Repository.uploadImage(base64, key);
        return { word: card.word, imageUrl, success: true };
      })
    );

    return results.map((r, i) =>
      r.status === 'fulfilled'
        ? r.value
        : { word: flashcards[i].word, imageUrl: '', success: false }
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
    const key = buildR2Key({
      storybookId,
      storybookTitle: storybookTitle ?? '',
      fileType: typePart,
      identifier: namePart,
      extension: ext,
    });
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
    // multer decodes filenames as Latin1; re-decode to UTF-8 for Korean filenames
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const ext = originalName.split('.').pop() ?? 'mp3';
    const key = buildR2Key({
      storybookId,
      storybookTitle: storybookTitle ?? '',
      fileType: 'bgm',
      extension: ext,
    });
    const audioUrl = await R2Repository.uploadBuffer(file.buffer, key, file.mimetype);

    // Add to BGM library JSON
    try {
      const existing = await this.getBgmList();
      const title = originalName.replace(/\.[^.]+$/, '');
      existing.push({
        id: `bgm_${Date.now()}`,
        title,
        url: audioUrl,
        createdAt: new Date().toISOString(),
      });
      await uploadJsonToR2(existing, 'background-music.json');
    } catch (err) {
      console.warn('[image] Failed to update BGM library JSON:', err);
    }

    return audioUrl;
  },

  async deleteBgm(bgmId: string): Promise<void> {
    const existing = await this.getBgmList();
    const target = existing.find((item) => item.id === bgmId);
    if (!target) throw new AppError(404, 'BGM을 찾을 수 없습니다.');

    // Delete from R2
    const key = urlToR2Key(target.url);
    await deleteFromR2(key);

    // Update library JSON
    const updated = existing.filter((item) => item.id !== bgmId);
    await uploadJsonToR2(updated, 'background-music.json');
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

// --- 저작권 회피: 캐릭터 이름 → 제네릭 별칭 치환 ---

/**
 * 캐릭터 이름 → 제네릭 별칭(Character A, B, ...) 매핑 생성.
 * UI에는 원래 이름을 보여주되, 이미지 프롬프트에서는 별칭을 사용하여
 * 저작권/상표권 필터링을 회피.
 */
function buildCharacterAliasMap(characters: Array<{ name: string }>): Map<string, string> {
  const labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const map = new Map<string, string>();
  characters.forEach((c, i) => {
    map.set(c.name, `Character ${labels[i] ?? i + 1}`);
  });
  return map;
}

/** 텍스트 내 모든 캐릭터 이름을 별칭으로 치환 */
function replaceNamesWithAliases(text: string, aliasMap: Map<string, string>): string {
  let result = text;
  for (const [name, alias] of aliasMap) {
    result = result.replaceAll(name, alias);
  }
  return result;
}

// --- 공통 프롬프트 블록 ---

function artStyleBlock(artStyle: string, lang: 'en' | 'ko' = 'en'): string {
  if (lang === 'ko') {
    return `*** 필수 아트 스타일 (반드시 따를 것) ***
${artStyle}
*** 아트 스타일 끝 ***
모든 삽화는 반드시 위에 명시된 아트 스타일로 그려야 합니다. 기본 카툰이나 디지털 아트 스타일로 대체하지 마세요.`;
  }
  return `*** MANDATORY ART STYLE (MUST FOLLOW EXACTLY) ***
${artStyle}
*** END ART STYLE ***
The entire illustration MUST be rendered strictly in the art style described above. Every element — line work, coloring technique, texture, shading, and overall aesthetic — must match this style precisely. Do NOT default to generic cartoon or digital art style.`;
}

function isolatedObjectPrompt(word: string, hasDescription = false): string {
  return `완전히 깨끗한 순백색(#FFFFFF) 배경에 "${word}"가 뜻하는 사물/동물/대상 딱 하나만 그려주세요.${hasDescription ? ` 위 "구체적 묘사"를 반드시 반영하세요.` : ''} 배경, 그림자, 바닥면, 장식, 다른 인물, 다른 사물 일절 없이 대상만 중앙에 크게 배치하세요. 어휘 플래시카드이므로 대상 외 아무것도 그리지 마세요. 이미지에 텍스트, 글자, 라벨을 포함하지 마세요.`;
}

// --- 프롬프트 빌더 ---

function buildCharacterPrompt(
  char: Character,
  artStyle: string,
  aspectRatio: string,
  alias?: string
): string {
  const heightInfo = char.heightCm
    ? `\nReal-world Height: approximately ${char.heightCm}cm. Draw body proportions appropriate for this height.`
    : '';
  const displayName = alias ?? char.name;
  const appearance = char.descriptionEn ?? char.description;
  return `Create a professional character design reference sheet for a children's storybook.

Character: ${displayName}
Appearance: ${appearance}
Age: ${char.age ?? 'unknown'}${heightInfo}
Relative Height Scale: ${char.height}/200 (used for sizing relative to other characters)
Aspect Ratio: ${aspectRatio}

${artStyleBlock(artStyle)}

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
  hasPreviousIllustration = false,
  aliasMap?: Map<string, string>,
  flashcardWords: string[] = []
): string {
  const san = (text: string) => (aliasMap ? replaceNamesWithAliases(text, aliasMap) : text);
  const charList = chars
    .map((c) => {
      const cm = (c as Character & { heightCm?: number }).heightCm;
      const name = aliasMap?.get(c.name) ?? c.name;
      return `- ${name} (relative height: ${c.height}/200${cm ? `, ~${cm}cm tall` : ''})`;
    })
    .join('\n');

  const prevRef = hasPreviousIllustration
    ? `\nPREVIOUS PAGE REFERENCE: The last reference image is the previous page's illustration. Use it to maintain visual continuity:
- Keep the same art style, color palette, and rendering technique.
- If the scene is in the same location, maintain spatial layout (object positions, left/right orientation).
- Maintain consistent day/night lighting and weather conditions unless the scene explicitly changes.
- Keep character proportions and object sizes consistent with the previous page.\n`
    : '';

  // 수정사항이 있으면 기존 장면 텍스트 무시, 현재 이미지 + 수정사항만 반영
  const sceneDesc = san(page.scene_description_en ?? page.scene_description ?? '');
  const sceneChars = san(
    page.scene_structure?.characters_en ?? page.scene_structure?.characters ?? ''
  );
  const sceneBg = san(
    page.scene_structure?.background_en ?? page.scene_structure?.background ?? ''
  );
  const sceneAtmo = san(
    page.scene_structure?.atmosphere_en ?? page.scene_structure?.atmosphere ?? ''
  );

  const sceneSection = page.customModifications
    ? `MODIFICATION REQUEST: Modify the current illustration based on the following instructions. The current image is provided as a reference — keep everything NOT mentioned in the modifications unchanged.

Modifications: ${page.customModifications}`
    : `Scene: ${sceneDesc}
Characters & Actions: ${sceneChars}
Background: ${sceneBg}
Atmosphere: ${sceneAtmo}`;

  return `Create a storybook illustration for children.

${sceneSection}
Aspect Ratio: ${aspectRatio}

${artStyleBlock(artStyle)}

Characters present (match EXACTLY to reference images):
${charList}
${
  flashcardWords.length > 0
    ? `
VOCABULARY REFERENCE IMAGES: Reference images for specific vocabulary words are provided (after character references). These show the EXACT visual appearance of each word's object. When these words appear in the scene, draw the objects matching these reference images exactly — same type, color, and shape. This is critical for words with multiple meanings (e.g., "fan" could be a folding fan or electric fan — use the one shown in the reference).
Words with reference images: ${flashcardWords.map((w) => `"${w}"`).join(', ')}
`
    : ''
}${prevRef}

CRITICAL - NO TEXT: No text, speech bubbles, or labels in the image.`;
}

function buildCoverPrompt(
  storybook: { title: string; coverPrompt?: string; artStyle: string },
  aspectRatio: string,
  aliasMap?: Map<string, string>,
  hasTitleTemplate = false
): string {
  const san = (text: string) => (aliasMap ? replaceNamesWithAliases(text, aliasMap) : text);
  const titleRef = hasTitleTemplate
    ? '\n\nTITLE STYLE REFERENCE: The first reference image shows the desired title text layout and typography style. Follow this style closely for the title placement, font style, colors, and decorative elements.'
    : '';
  return `Create a beautiful children's book cover illustration.

Book Title: ${san(storybook.title)}
${storybook.coverPrompt ? `Cover Description: ${san(storybook.coverPrompt)}` : ''}
Aspect Ratio: ${aspectRatio}

${artStyleBlock(storybook.artStyle)}

Quality: Professional children's book cover, vibrant and eye-catching.
TITLE TEXT: Include the book title "${storybook.title}" prominently on the cover using decorative, child-friendly typography. No other text.${titleRef}`;
}

function buildPhonicsCoverPrompt(
  storybook: { title: string; coverPrompt?: string; artStyle: string },
  phonics: { titleText: string; blendingWords: string[]; characters: string[] },
  aspectRatio: string,
  aliasMap?: Map<string, string>,
  hasTitleTemplate = false
): string {
  const san = (text: string) => (aliasMap ? replaceNamesWithAliases(text, aliasMap) : text);
  const wordsStr =
    phonics.blendingWords.length > 0 ? `\nBlending Words: ${phonics.blendingWords.join(', ')}` : '';
  const charsStr =
    phonics.characters.length > 0
      ? `\nCharacters: ${phonics.characters.map((c) => san(c)).join(', ')}`
      : '';
  const sceneDesc = storybook.coverPrompt
    ? `\nScene Description: ${san(storybook.coverPrompt)}`
    : '';

  const mainTitle = san(storybook.title);

  return `Create a children's phonics workbook cover illustration.
This is a phonics learning material cover, not a storybook cover.

Level/Unit Label: "${phonics.titleText}"
Main Title: "${mainTitle}"${wordsStr}${charsStr}${sceneDesc}
Aspect Ratio: ${aspectRatio}

${artStyleBlock(storybook.artStyle)}

=== LAYOUT INSTRUCTIONS ===
1. TOP-LEFT CORNER: Place "${phonics.titleText}" in small, simple text (subtitle size). Use a small rounded badge or subtle label style. This is NOT the main title — keep it small and unobtrusive.
2. CENTER/TOP AREA: Place the main title "${mainTitle}" prominently using large, bold, colorful, child-friendly decorative typography. This is the biggest text on the cover. Use a banner, ribbon, or rounded rectangle background for contrast.
3. MAIN ILLUSTRATION AREA: Draw the characters in a fun, dynamic scene that relates to the blending words. ${phonics.blendingWords.length > 0 ? `Incorporate visual hints of the words (${phonics.blendingWords.slice(0, 4).join(', ')}) naturally into the scene as objects or actions.` : ''}
4. STYLE: Bright, colorful, professional children's educational workbook cover. Clean layout with clear visual hierarchy.
5. Only two text elements allowed: the small "${phonics.titleText}" label (top-left) and the large "${mainTitle}" title. Do NOT add word labels, speech bubbles, or any other text.${hasTitleTemplate ? '\n\nTITLE STYLE REFERENCE: The first reference image shows the desired title text layout and typography style. Follow this style closely for the title placement, font style, colors, and decorative elements.' : ''}`;
}

function buildKeyObjectPrompt(obj: KeyObject, artStyle: string): string {
  const word = obj.nameEn ?? obj.name;
  const sizeInfo = obj.sizeCm
    ? `\nReal-world Size: approximately ${obj.sizeCm}cm (${obj.sizeCategory ?? 'medium'}). Draw the object at proportions that reflect this real-world size.`
    : obj.sizeCategory
      ? `\nSize Category: ${obj.sizeCategory}. Draw the object at proportions appropriate for a ${obj.sizeCategory}-sized object.`
      : '';
  const hasCustom = !!obj.customPrompt;
  return `${isolatedObjectPrompt(word, hasCustom)}
${hasCustom ? `\n구체적 묘사: ${obj.customPrompt}` : ''}
Description: ${obj.description}${sizeInfo}

${artStyleBlock(artStyle)}`;
}
