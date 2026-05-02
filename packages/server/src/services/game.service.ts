import { R2Repository } from '../repositories/r2.repository.js';
import { AppError } from '../middleware/error.middleware.js';
import { shuffle } from '../utils/shuffle.js';
import { collectStorybookImagePool } from '../utils/phonics-data-helpers.js';
import { TtsService } from './tts.service.js';
import type {
  Storybook,
  GameTypeId,
  GameConfig,
  GameData,
  WordWritingConfig,
  WordWritingData,
  ConnectTheDotsConfig,
  ConnectTheDotsData,
  KoreanBlockConfig,
  KoreanBlockData,
  EnglishBlockConfig,
  EnglishBlockData,
  KoreanSpeakingData,
  EnglishSpeakingData,
  SpeakingItem,
  KoreanLineMatchingConfig,
  EnglishLineMatchingConfig,
  KoreanLineMatchingData,
  EnglishLineMatchingData,
  LineMatchingItem,
  KoreanStoryImageConfig,
  EnglishStoryImageConfig,
  KoreanStoryImageData,
  EnglishStoryImageData,
  StoryImageRound,
} from '@tangobook/shared';
import { decomposeWord, isHangulSyllable } from '@tangobook/shared';
import { decomposeEnglishWord } from '@tangobook/shared';
import { getEffectiveVocabulary } from '@tangobook/shared';

type GameGenerator = (storybook: Storybook, config: GameConfig) => Promise<GameData>;

// 전략 패턴: 게임 타입별 생성 함수
const generators: Partial<Record<GameTypeId, GameGenerator>> = {
  'korean-word-writing': generateWordWriting,
  'english-word-writing': generateWordWriting,
  'connect-the-dots': generateConnectTheDots,
  'korean-block': generateKoreanBlock,
  'english-block': generateEnglishBlock,
  'korean-speaking': (storybook: Storybook) => generateKoreanSpeaking(storybook.id),
  'english-speaking': (storybook: Storybook) => generateEnglishSpeaking(storybook.id),
  'korean-line-matching': (sb, cfg) =>
    generateLineMatching(sb, cfg as KoreanLineMatchingConfig, 'ko'),
  'english-line-matching': (sb, cfg) =>
    generateLineMatching(sb, cfg as EnglishLineMatchingConfig, 'en'),
  'korean-story-image': (sb, cfg) => generateStoryImage(sb, cfg as KoreanStoryImageConfig, 'ko'),
  'english-story-image': (sb, cfg) => generateStoryImage(sb, cfg as EnglishStoryImageConfig, 'en'),
};

export const GameService = {
  async generate(storybookId: string, gameType: GameTypeId, config: GameConfig): Promise<GameData> {
    const storybook = await R2Repository.getStorybook(storybookId);
    if (!storybook) throw new AppError(404, '동화책을 찾을 수 없습니다.');

    const generator = generators[gameType];
    if (!generator) throw new AppError(400, `아직 지원하지 않는 게임 타입: ${gameType}`);

    return generator(storybook, config);
  },
};

// --- 낱말 쓰기: 어휘에서 단어 추출 ---
async function generateWordWriting(
  storybook: Storybook,
  config: GameConfig
): Promise<WordWritingData> {
  const c = config as WordWritingConfig;
  const items: {
    word: string;
    displayWord: string;
    imageUrl?: string;
    referenceImageUrl: string;
    ttsUrl?: string;
  }[] = [];

  const selected = c.selectedWords && c.selectedWords.length > 0 ? new Set(c.selectedWords) : null;

  if (c.wordSource === 'vocabulary') {
    const vocab = getEffectiveVocabulary(storybook);
    for (const v of vocab) {
      if (selected && !selected.has(v.word)) continue;
      const word = c.language === 'korean' ? v.korean : v.word;
      const displayWord = c.language === 'korean' ? v.word : v.korean;
      // 이미지: vocabularyImages 우선, 없으면 keyObjectImages 에서 영어/한글 매칭
      const vocabImg = (storybook.vocabularyImages ?? []).find(
        (vi) => vi.word === v.word && vi.success && vi.imageUrl
      );
      const koImg = !vocabImg
        ? (storybook.keyObjectImages ?? []).find(
            (ki) =>
              ki.success && ki.imageUrl && (ki.objectName === v.word || ki.objectName === v.korean)
          )
        : null;
      items.push({
        word,
        displayWord,
        imageUrl: vocabImg?.imageUrl || koImg?.imageUrl,
        referenceImageUrl: '',
      });
    }
  } else if (c.wordSource === 'phonics') {
    const flashcards = storybook.flashcards ?? [];
    for (const f of flashcards) {
      if (selected && !selected.has(f.word)) continue;
      const word = c.language === 'korean' ? f.localWord : f.word;
      const displayWord = c.language === 'korean' ? f.word : f.localWord;
      items.push({
        word,
        displayWord,
        imageUrl: f.imageUrl,
        referenceImageUrl: '',
        ttsUrl: f.ttsUrl,
      });
    }
  } else if (c.wordSource === 'custom') {
    for (const w of c.customWords ?? []) {
      items.push({ word: w, displayWord: w, referenceImageUrl: '' });
    }
  }

  if (items.length === 0) {
    throw new AppError(400, '낱말 쓰기에 사용할 단어가 없습니다.');
  }

  return { type: c.type, items };
}

// --- 점잇기: 핵심단어 이미지 (신규) / 삽화 페이지 (레거시) ---
async function generateConnectTheDots(
  storybook: Storybook,
  config: GameConfig
): Promise<ConnectTheDotsData> {
  const c = config as ConnectTheDotsConfig;
  const mode = c.sourceMode ?? 'pages';

  if (mode === 'objects') {
    const keyObjectImages = storybook.keyObjectImages ?? [];
    const selectedNames = c.sourceObjects ?? [];

    const candidates = keyObjectImages.filter((img) => {
      if (!img.imageUrl || !img.success) return false;
      if (!img.keypoints || img.keypoints.length < 2) return false;
      if (selectedNames.length > 0) return selectedNames.includes(img.objectName);
      return true;
    });

    if (candidates.length === 0) {
      throw new AppError(
        400,
        '점이 등록된 핵심단어 이미지가 없습니다. 핵심사물 탭에서 점을 먼저 등록해주세요.'
      );
    }

    const items = candidates.map((img) => ({
      pageNumber: 0,
      objectName: img.objectName,
      originalImageUrl: img.imageUrl,
      keypoints: [...img.keypoints!],
    }));

    return { type: 'connect-the-dots', items };
  }

  // 레거시: 페이지 삽화 기반
  const pages = storybook.pages ?? [];
  const targetPages =
    c.sourcePages.length > 0
      ? pages.filter((p) => c.sourcePages.includes(p.pageNumber) && p.illustrationUrl)
      : pages.filter((p) => p.illustrationUrl);

  if (targetPages.length === 0) {
    throw new AppError(400, '점잇기에 사용할 삽화가 없습니다.');
  }

  const items = targetPages.map((p) => ({
    pageNumber: p.pageNumber,
    originalImageUrl: p.illustrationUrl!,
    keypoints: [] as { x: number; y: number; order: number }[],
  }));

  return { type: 'connect-the-dots', items };
}

// --- 블록 맞추기 공통 헬퍼 ---
function generateBlockGame<T>(
  storybook: Storybook,
  config: GameConfig,
  opts: {
    filterPool: (pool: ReturnType<typeof collectStorybookImagePool>) => typeof pool;
    mapItem: (item: ReturnType<typeof collectStorybookImagePool>[number]) => T;
    errorMessage: string;
  }
): T[] {
  const c = config as KoreanBlockConfig | EnglishBlockConfig;
  const pool = collectStorybookImagePool(storybook, {
    includeCharacters: c.includeCharacters,
    includeKeyObjects: c.includeKeyObjects,
    includeFlashcards: true,
  });
  const filtered = opts.filterPool(pool);
  if (filtered.length < 1) throw new AppError(400, opts.errorMessage);
  return shuffle(filtered).slice(0, Math.min(c.itemCount, filtered.length)).map(opts.mapItem);
}

async function generateKoreanBlock(
  storybook: Storybook,
  config: GameConfig
): Promise<KoreanBlockData> {
  const items = generateBlockGame(storybook, config, {
    filterPool: (pool) =>
      pool.filter((item) => item.korean && [...item.korean].some(isHangulSyllable)),
    mapItem: (item) => ({
      word: item.korean,
      imageUrl: item.imageUrl,
      ttsUrl: item.ttsUrl,
      syllables: decomposeWord(item.korean),
    }),
    errorMessage: '한글 블록 게임을 만들기 위한 한글 단어가 부족합니다.',
  });
  return { type: 'korean-block', items };
}

async function generateEnglishBlock(
  storybook: Storybook,
  config: GameConfig
): Promise<EnglishBlockData> {
  const items = generateBlockGame(storybook, config, {
    filterPool: (pool) =>
      pool.filter((item) => {
        const w = item.word?.toLowerCase();
        return w && /^[a-z]+$/.test(w) && w.length <= 6;
      }),
    mapItem: (item) => ({
      word: item.word.toLowerCase(),
      korean: item.korean,
      imageUrl: item.imageUrl,
      ttsUrl: item.ttsUrl,
      letters: decomposeEnglishWord(item.word),
    }),
    errorMessage: '영어 블록 게임을 만들기 위한 영어 단어가 부족합니다.',
  });
  return { type: 'english-block', items };
}

// --- 말하기 게임 (korean/english-speaking): vocab→item 순수 변환 + 필요 시 TTS 실시간 생성 ---

function slugifyForTtsKey(word: string): string {
  return encodeURIComponent(word.trim().toLowerCase().replace(/\s+/g, '-'));
}

async function generateSpeaking(storybookId: string, lang: 'ko' | 'en'): Promise<SpeakingItem[]> {
  const storybook = await R2Repository.getStorybook(storybookId);
  if (!storybook) throw new AppError(404, '동화책을 찾을 수 없습니다.');

  const pool = collectStorybookImagePool(storybook, {
    includeKeyObjects: true,
    includeCharacters: false,
    includeFlashcards: false,
  });

  if (pool.length < 3) {
    throw new AppError(
      400,
      '이 책의 단어가 말하기 게임에 부족해요 (최소 3개 필요). 어휘·핵심단어 이미지를 먼저 생성해주세요.'
    );
  }

  const items: SpeakingItem[] = [];
  for (const p of pool) {
    const word = lang === 'ko' ? p.korean : p.word;
    if (!word) continue;

    let ttsUrl: string | undefined;
    if (lang === 'en' && p.ttsUrl) {
      ttsUrl = p.ttsUrl; // 파닉스 flashcards 영어 녹음 재사용
    }
    if (!ttsUrl) {
      ttsUrl = await TtsService.generate({
        text: word,
        provider: 'gemini',
        language: lang,
        storybookId,
        identifier: `speaking-${lang}-${slugifyForTtsKey(word)}`,
      });
    }

    items.push({
      word,
      displayWord: word,
      koreanMeaning: lang === 'en' ? p.korean : undefined,
      imageUrl: p.imageUrl,
      ttsUrl,
    });
  }

  return items;
}

export async function generateKoreanSpeaking(storybookId: string): Promise<KoreanSpeakingData> {
  return { type: 'korean-speaking', items: await generateSpeaking(storybookId, 'ko') };
}

export async function generateEnglishSpeaking(storybookId: string): Promise<EnglishSpeakingData> {
  return { type: 'english-speaking', items: await generateSpeaking(storybookId, 'en') };
}

// --- 선긋기 매칭 (한/영 공통 로직) ---
async function generateLineMatching(
  storybook: Storybook,
  config: KoreanLineMatchingConfig | EnglishLineMatchingConfig,
  lang: 'ko' | 'en'
): Promise<KoreanLineMatchingData | EnglishLineMatchingData> {
  const pool = collectStorybookImagePool(storybook, {
    includeKeyObjects: true,
    includeCharacters: false,
    includeFlashcards: false,
  });

  const desired = Math.max(config.itemCount ?? 4, 3);
  const picked = shuffle(pool).slice(0, Math.min(desired, pool.length));

  if (picked.length < 3) {
    throw new AppError(400, '이 책의 이미지 있는 단어가 부족해요 (최소 3개).');
  }

  const items: LineMatchingItem[] = picked
    .map((p) => ({
      word: lang === 'ko' ? p.korean : p.word,
      imageUrl: p.imageUrl,
      ttsUrl: p.ttsUrl,
    }))
    .filter((it) => !!it.word && !!it.imageUrl);

  if (items.length < 3) {
    throw new AppError(400, '이 책에서 선긋기 매칭 데이터가 부족해요 (최소 3개).');
  }

  return lang === 'ko'
    ? { type: 'korean-line-matching', items }
    : { type: 'english-line-matching', items };
}

// --- 스토리 듣고 이미지 맞추기 (한/영 공통 로직) ---
interface PageTextPick {
  text: string;
  ttsUrl: string;
  illustrationUrl: string;
}

function pickPageText(page: Storybook['pages'][number], lang: 'ko' | 'en'): PageTextPick | null {
  const illustrationUrl = page.illustrationUrl;
  if (!illustrationUrl) return null;

  // 언어에 맞춘 translations 우선, 없으면 base text/ttsUrl fallback (한국어 base)
  const translations = page.translations ?? {};
  let text = '';
  let ttsUrl = '';

  if (lang === 'ko') {
    // ko 우선 → base
    const koTrans = translations['ko'];
    if (koTrans?.text && koTrans?.ttsUrl) {
      text = koTrans.text;
      ttsUrl = koTrans.ttsUrl;
    } else if (page.text && page.ttsUrl) {
      text = page.text;
      ttsUrl = page.ttsUrl;
    }
  } else {
    // en 번역 필요
    const enTrans = translations['en'];
    if (enTrans?.text && enTrans?.ttsUrl) {
      text = enTrans.text;
      ttsUrl = enTrans.ttsUrl;
    }
  }

  if (!text || !ttsUrl) return null;
  return { text, ttsUrl, illustrationUrl };
}

async function generateStoryImage(
  storybook: Storybook,
  config: KoreanStoryImageConfig | EnglishStoryImageConfig,
  lang: 'ko' | 'en'
): Promise<KoreanStoryImageData | EnglishStoryImageData> {
  const pages = storybook.pages ?? [];
  const usable = pages
    .map((p) => pickPageText(p, lang))
    .filter((p): p is PageTextPick => p !== null);

  if (usable.length < 3) {
    throw new AppError(400, '이 책의 나레이션/일러스트가 부족해요 (최소 3 페이지).');
  }

  const roundCount = Math.min(config.roundCount ?? 5, usable.length);
  const optionsPerRound = Math.max(2, Math.min(config.optionsPerRound ?? 3, usable.length));
  const shuffled = shuffle([...usable]);

  const rounds: StoryImageRound[] = [];
  for (let i = 0; i < roundCount; i++) {
    const correct = shuffled[i];
    const distractorPool = usable.filter((p) => p.illustrationUrl !== correct.illustrationUrl);
    const distractors = shuffle(distractorPool).slice(0, optionsPerRound - 1);
    rounds.push({
      text: correct.text,
      ttsUrl: correct.ttsUrl,
      correctImageUrl: correct.illustrationUrl,
      distractorImageUrls: distractors.map((d) => d.illustrationUrl),
    });
  }

  return lang === 'ko'
    ? { type: 'korean-story-image', rounds }
    : { type: 'english-story-image', rounds };
}
