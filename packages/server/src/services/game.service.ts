import { R2Repository } from '../repositories/r2.repository.js';
import { generateTextWithGemini } from '../providers/gemini.provider.js';
import { parseGeminiJSON } from '../utils/parse-gemini-json.js';
import { AppError } from '../middleware/error.middleware.js';
import { shuffle } from '../utils/shuffle.js';
import {
  isKoreanPhonics,
  collectStorybookImagePool,
  collectPhonicsWordPool,
} from '../utils/phonics-data-helpers.js';
import { TtsService } from './tts.service.js';
import type {
  Storybook,
  GameTypeId,
  GameConfig,
  GameData,
  VocabularyMatchingConfig,
  VocabularyMatchingData,
  PictureSequenceConfig,
  PictureSequenceData,
  WordQuizConfig,
  WordQuizData,
  WordQuizQuestion,
  OddOneOutConfig,
  OddOneOutData,
  OddOneOutRound,
  WordWritingConfig,
  WordWritingData,
  ConnectTheDotsConfig,
  ConnectTheDotsData,
  WordImageMatchingData,
  BlendingListeningData,
  BlendingListeningRound,
  LetterSoundData,
  LetterSoundRound,
  WordListeningData,
  WordListeningRound,
  WordListeningOption,
  KoreanBlockConfig,
  KoreanBlockData,
  EnglishBlockConfig,
  EnglishBlockData,
  StorybookQuizConfig,
  StorybookQuizData,
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
  'vocabulary-matching': generateVocabularyMatching,
  'picture-sequence': generatePictureSequence,
  'word-quiz': generateWordQuiz,
  'odd-one-out': generateOddOneOut,
  'word-writing': generateWordWriting,
  'korean-word-writing': generateWordWriting,
  'english-word-writing': generateWordWriting,
  'connect-the-dots': generateConnectTheDots,
  'word-image-matching': generateWordImageMatching,
  'blending-listening': generateBlendingListening,
  'letter-sound': generateLetterSound,
  'word-listening': generateWordListening,
  'korean-block': generateKoreanBlock,
  'english-block': generateEnglishBlock,
  'storybook-quiz': generateStorybookQuiz,
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

// --- 단어 매칭: vocabImages + keyObjectImages + flashcards에서 추출 ---
async function generateVocabularyMatching(
  storybook: Storybook,
  config: GameConfig
): Promise<VocabularyMatchingData> {
  const c = config as VocabularyMatchingConfig;

  const pool = collectStorybookImagePool(storybook, {
    includeCharacters: c.includeCharacters,
    includeKeyObjects: c.includeKeyObjects,
    includeFlashcards: true,
  }).map((item) => ({
    word: item.word,
    korean: item.korean,
    imageUrl: item.imageUrl,
    ttsUrl: item.ttsUrl,
  }));

  if (pool.length < 2) {
    throw new AppError(400, '매칭 게임을 만들기 위한 이미지가 부족합니다. (최소 2개 필요)');
  }

  const items = shuffle(pool).slice(0, Math.min(c.itemCount, pool.length));
  return { type: 'vocabulary-matching', items };
}

// --- 그림 순서 맞추기: 페이지 삽화에서 데이터 추출 ---
async function generatePictureSequence(
  storybook: Storybook,
  config: GameConfig
): Promise<PictureSequenceData> {
  const c = config as PictureSequenceConfig;

  const pagesWithIllustration = (storybook.pages ?? []).filter((p) => p.illustrationUrl);
  if (pagesWithIllustration.length < 3) {
    throw new AppError(400, '삽화가 있는 페이지가 3개 이상 필요합니다.');
  }

  const count = Math.min(c.imageCount, pagesWithIllustration.length);
  const step = pagesWithIllustration.length / count;
  const selected = Array.from({ length: count }, (_, i) => {
    const idx = Math.min(Math.floor(i * step), pagesWithIllustration.length - 1);
    return pagesWithIllustration[idx];
  });

  const images = selected.map((p, i) => ({
    imageUrl: p.illustrationUrl!,
    correctOrder: i + 1,
    caption: p.text,
  }));

  return { type: 'picture-sequence', images };
}

// --- 단어 퀴즈: Gemini 텍스트 생성 ---
async function generateWordQuiz(storybook: Storybook, config: GameConfig): Promise<WordQuizData> {
  const c = config as WordQuizConfig;

  const vocab = getEffectiveVocabulary(storybook);
  const flashcards = storybook.flashcards ?? [];

  const wordList = [
    ...vocab.map((v) => `${v.word} (${v.korean}): ${v.definition}`),
    ...flashcards.map((f) => `${f.word} (${f.localWord})`),
  ];

  if (wordList.length < 3) {
    throw new AppError(400, '퀴즈를 만들기 위한 단어가 부족합니다. (최소 3개 필요)');
  }

  const typeDescriptions = c.questionTypes
    .map((t) => ({ meaning: '뜻 맞추기', spelling: '철자 맞추기', picture: '그림 설명 맞추기' })[t])
    .join(', ');

  const prompt = `다음 단어 목록으로 어린이용 단어 퀴즈를 ${c.questionCount}개 생성해주세요.

단어 목록:
${wordList.join('\n')}

문제 유형: ${typeDescriptions}
대상: 유아동 (4-8세)

JSON 배열로 응답:
[
  {
    "question": "질문 (한글)",
    "options": ["보기1", "보기2", "보기3", "보기4"],
    "correctAnswer": 0
  }
]

규칙:
- 질문과 보기 모두 한글로
- correctAnswer는 0부터 시작하는 인덱스
- 보기는 반드시 4개
- JSON만 응답`;

  const raw = await generateTextWithGemini(prompt);
  const questions = parseGeminiJSON<WordQuizQuestion[]>(raw, '단어 퀴즈 생성 결과 파싱 실패');

  return { type: 'word-quiz', questions };
}

// --- 다른 것 찾기: Gemini로 카테고리 분류 ---
async function generateOddOneOut(storybook: Storybook, config: GameConfig): Promise<OddOneOutData> {
  const c = config as OddOneOutConfig;

  const pool = collectStorybookImagePool(storybook, {
    includeCharacters: true,
    includeKeyObjects: true,
    includeFlashcards: true,
  });

  if (pool.length < c.optionsPerRound + 1) {
    throw new AppError(
      400,
      `다른 것 찾기 게임에 이미지가 부족합니다. (최소 ${c.optionsPerRound + 1}개 필요, 현재 ${pool.length}개)`
    );
  }

  const wordListStr = pool.map((p) => `${p.word} (${p.korean})`).join(', ');

  const prompt = `다음 단어 목록으로 "다른 것 찾기" 게임을 ${c.roundCount}라운드 생성해주세요.

단어 목록: ${wordListStr}

각 라운드에서 ${c.optionsPerRound}개의 단어를 선택합니다.
그 중 ${c.optionsPerRound - 1}개는 같은 카테고리, 1개는 다른 카테고리여야 합니다.

JSON 배열로 응답:
[
  {
    "category": "카테고리명 (한글)",
    "words": ["같은카테고리1", "같은카테고리2", "같은카테고리3"],
    "oddOneOut": "다른카테고리단어",
    "explanation": "왜 다른지 한글 설명"
  }
]

규칙:
- words 배열의 단어와 oddOneOut은 반드시 위 목록에 있는 영어 단어(word) 그대로 사용
- 라운드마다 다른 단어 조합 사용
- JSON만 응답`;

  const raw = await generateTextWithGemini(prompt);

  interface RawRound {
    category: string;
    words: string[];
    oddOneOut: string;
    explanation: string;
  }

  const rawRounds = parseGeminiJSON<RawRound[]>(raw, '다른 것 찾기 생성 결과 파싱 실패');

  const rounds: OddOneOutRound[] = rawRounds.map((r) => {
    const allWords = [...r.words, r.oddOneOut];
    const options = allWords.map((w) => {
      const found = pool.find((p) => p.word.toLowerCase() === w.toLowerCase());
      return {
        word: w,
        korean: found?.korean ?? w,
        imageUrl: found?.imageUrl ?? '',
        isOddOneOut: w.toLowerCase() === r.oddOneOut.toLowerCase(),
      };
    });
    return { category: r.category, options: shuffle(options), explanation: r.explanation };
  });

  return { type: 'odd-one-out', rounds };
}

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

// --- 단어-그림 선긋기: 블렌딩 데이터에서 이미지 있는 단어 그룹 추출 ---
async function generateWordImageMatching(storybook: Storybook): Promise<WordImageMatchingData> {
  const blending = storybook.phonicsLesson?.blending ?? [];
  const wordFamilies = storybook.phonicsLesson?.wordFamilies ?? [];

  const groupMap = new Map<string, { word: string; imageUrl: string; ttsUrl?: string }[]>();

  for (let i = 0; i < blending.length; i++) {
    const ex = blending[i];
    const blend = ex.blend;
    if (!groupMap.has(blend)) groupMap.set(blend, []);
    const arr = groupMap.get(blend)!;

    if (ex.exampleWordImageUrl && !arr.some((a) => a.word === ex.exampleWord)) {
      arr.push({
        word: ex.exampleWord,
        imageUrl: ex.exampleWordImageUrl,
        ttsUrl: ex.exampleWordTtsUrl,
      });
    }
    if (
      ex.exampleWord2 &&
      ex.exampleWord2ImageUrl &&
      !arr.some((a) => a.word === ex.exampleWord2)
    ) {
      arr.push({
        word: ex.exampleWord2,
        imageUrl: ex.exampleWord2ImageUrl,
        ttsUrl: ex.exampleWord2TtsUrl,
      });
    }
    const wf = wordFamilies[i];
    if (wf) {
      for (const w of wf.words) {
        if (w.imageUrl && !arr.some((a) => a.word === w.word)) {
          arr.push({ word: w.word, imageUrl: w.imageUrl, ttsUrl: w.ttsUrl });
        }
      }
    }
    if (arr.length === 0 && ex.illustrationUrl && ex.exampleWord) {
      arr.push({
        word: ex.exampleWord,
        imageUrl: ex.illustrationUrl,
        ttsUrl: ex.exampleWordTtsUrl,
      });
    }
  }

  const qualifying = Array.from(groupMap.entries())
    .filter(([, items]) => items.length >= 1)
    .map(([blend, items]) => ({ blend, items: items.slice(0, 2) }));

  if (qualifying.length >= 2) {
    const groups = shuffle(qualifying).slice(0, 2);
    const totalItems = groups.reduce((s, g) => s + g.items.length, 0);
    if (totalItems >= 2) {
      return { type: 'word-image-matching', groups };
    }
  }

  const flashcards = storybook.flashcards ?? [];
  const fcWithImages = flashcards.filter((fc) => fc.imageUrl && fc.word);
  if (fcWithImages.length < 2) {
    throw new AppError(400, '선긋기 게임에 이미지가 있는 단어가 2개 이상 필요합니다.');
  }

  const shuffledFc = shuffle(fcWithImages);
  const half = Math.ceil(shuffledFc.length / 2);
  const groups = [
    {
      blend: '단어',
      items: shuffledFc.slice(0, half).map((fc) => ({
        word: fc.localWord || fc.word,
        imageUrl: fc.imageUrl!,
        ttsUrl: fc.ttsUrl,
      })),
    },
    {
      blend: '그림',
      items: shuffledFc.slice(half).map((fc) => ({
        word: fc.localWord || fc.word,
        imageUrl: fc.imageUrl!,
        ttsUrl: fc.ttsUrl,
      })),
    },
  ];

  return { type: 'word-image-matching', groups };
}

// --- 블렌딩 듣기 맞추기: 블렌딩별 단어 쌍 라운드 구성 ---
async function generateBlendingListening(storybook: Storybook): Promise<BlendingListeningData> {
  const blending = storybook.phonicsLesson?.blending ?? [];
  const wordFamilies = storybook.phonicsLesson?.wordFamilies ?? [];
  const rounds: BlendingListeningRound[] = [];

  for (let i = 0; i < blending.length; i++) {
    const ex = blending[i];
    type QW = { word: string; imageUrl: string; ttsUrl: string };
    const candidates: QW[] = [];

    if (ex.exampleWordImageUrl && ex.exampleWordTtsUrl) {
      candidates.push({
        word: ex.exampleWord,
        imageUrl: ex.exampleWordImageUrl,
        ttsUrl: ex.exampleWordTtsUrl,
      });
    }
    if (ex.exampleWord2 && ex.exampleWord2ImageUrl && ex.exampleWord2TtsUrl) {
      candidates.push({
        word: ex.exampleWord2,
        imageUrl: ex.exampleWord2ImageUrl,
        ttsUrl: ex.exampleWord2TtsUrl,
      });
    }
    const wf = wordFamilies[i];
    if (wf && candidates.length < 2) {
      for (const w of wf.words) {
        if (w.imageUrl && w.ttsUrl && !candidates.some((c) => c.word === w.word)) {
          candidates.push({ word: w.word, imageUrl: w.imageUrl, ttsUrl: w.ttsUrl });
        }
        if (candidates.length >= 2) break;
      }
    }

    if (candidates.length >= 2) {
      rounds.push({
        targetWord: candidates[0].word,
        targetImageUrl: candidates[0].imageUrl,
        targetTtsUrl: candidates[0].ttsUrl,
        distractorWord: candidates[1].word,
        distractorImageUrl: candidates[1].imageUrl,
        blend: ex.blend,
      });
      rounds.push({
        targetWord: candidates[1].word,
        targetImageUrl: candidates[1].imageUrl,
        targetTtsUrl: candidates[1].ttsUrl,
        distractorWord: candidates[0].word,
        distractorImageUrl: candidates[0].imageUrl,
        blend: ex.blend,
      });
    }
  }

  if (rounds.length === 0) {
    throw new AppError(400, '듣기 퀴즈에 이미지와 TTS가 있는 단어 쌍이 필요합니다.');
  }

  return { type: 'blending-listening', rounds: shuffle(rounds) };
}

// --- 음가 듣기: Level 1 알파벳 음가 TTS를 듣고 글자 맞추기 ---
async function generateLetterSound(storybook: Storybook): Promise<LetterSoundData> {
  const blending = storybook.phonicsLesson?.blending ?? [];
  const wordFamilies = storybook.phonicsLesson?.wordFamilies ?? [];
  const isKorean = isKoreanPhonics(storybook);

  const alphaItems: { letter: string; ttsUrl: string }[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < blending.length; i++) {
    const item = blending[i];
    let letter: string;

    if (isKorean) {
      if (!item.blend || !/^[가-힣]$/.test(item.blend)) continue;
      letter = item.blend;
    } else {
      if (item.vowel.length !== 1 || !/^[A-Za-z]$/.test(item.vowel)) continue;
      letter = item.vowel.toUpperCase();
    }
    if (seen.has(letter)) continue;

    let ttsUrl = isKorean
      ? item.blendTtsUrl ||
        item.blendingSequenceTtsUrl ||
        item.vowelTtsUrl ||
        item.consonantTtsUrl ||
        item.exampleWordTtsUrl
      : item.vowelTtsUrl ||
        item.consonantTtsUrl ||
        item.blendTtsUrl ||
        item.blendingSequenceTtsUrl ||
        item.exampleWordTtsUrl;

    if (!ttsUrl) {
      const wf = wordFamilies[i];
      if (wf) {
        const wordWithTts = wf.words.find((w) => w.ttsUrl);
        if (wordWithTts) ttsUrl = wordWithTts.ttsUrl;
      }
    }
    if (!ttsUrl) continue;
    seen.add(letter);
    alphaItems.push({ letter, ttsUrl });
  }

  if (alphaItems.length < 2) {
    throw new AppError(400, '음가 듣기 게임에 TTS가 있는 알파벳이 2개 이상 필요합니다.');
  }

  const shuffled = shuffle(alphaItems);
  const rounds: LetterSoundRound[] = shuffled.map((target) => {
    const distractors = shuffle(alphaItems.filter((i) => i.letter !== target.letter))
      .slice(0, 3)
      .map((i) => i.letter);
    const options = shuffle([target.letter, ...distractors]);
    return { targetLetter: target.letter, ttsUrl: target.ttsUrl, options };
  });

  return { type: 'letter-sound', rounds };
}

// --- 듣고 단어 맞추기: TTS를 듣고 올바른 그림 클릭 ---
async function generateWordListening(storybook: Storybook): Promise<WordListeningData> {
  const pool = collectPhonicsWordPool(storybook);

  if (pool.length < 2) {
    throw new AppError(
      400,
      '듣고 단어 맞추기 게임에 이미지와 TTS가 있는 단어가 2개 이상 필요합니다.'
    );
  }

  const shuffled = shuffle(pool);
  const maxRounds = Math.min(shuffled.length, 10);
  const rounds: WordListeningRound[] = [];

  for (let i = 0; i < maxRounds; i++) {
    const target = shuffled[i];
    const distractorCount = Math.min(pool.length - 1, 3);
    const distractors = shuffle(pool.filter((p) => p.word !== target.word)).slice(
      0,
      distractorCount
    );

    const options: WordListeningOption[] = shuffle([
      { word: target.word, imageUrl: target.imageUrl },
      ...distractors.map((d) => ({ word: d.word, imageUrl: d.imageUrl })),
    ]);

    rounds.push({ targetWord: target.word, targetTtsUrl: target.ttsUrl, options });
  }

  return { type: 'word-listening', rounds };
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

// --- 동화책 퀴즈: educational_content.quiz에서 직접 추출 ---
async function generateStorybookQuiz(
  storybook: Storybook,
  config: GameConfig
): Promise<StorybookQuizData> {
  const c = config as StorybookQuizConfig;
  const allQuiz = storybook.educational_content?.quiz ?? [];

  if (allQuiz.length === 0) {
    throw new AppError(400, '동화책에 퀴즈 데이터가 없습니다.');
  }

  const count = Math.min(c.questionCount, allQuiz.length);
  const questions = shuffle([...allQuiz]).slice(0, count);
  return { type: 'storybook-quiz', questions };
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
