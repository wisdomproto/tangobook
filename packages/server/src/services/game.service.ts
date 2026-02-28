import { R2Repository } from '../repositories/r2.repository.js';
import { generateTextWithGemini } from '../providers/gemini.provider.js';
import { parseGeminiJSON } from '../utils/parse-gemini-json.js';
import { AppError } from '../middleware/error.middleware.js';
import type {
  Storybook,
  GameTypeId,
  GameConfig,
  GameData,
  VocabularyMatchingConfig,
  VocabularyMatchingData,
  VocabularyMatchingItem,
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
  InitialSoundData,
  InitialSoundRound,
} from '@tangobook/shared';

type GameGenerator = (storybook: Storybook, config: GameConfig) => Promise<GameData>;

// 전략 패턴: 게임 타입별 생성 함수
const generators: Partial<Record<GameTypeId, GameGenerator>> = {
  'vocabulary-matching': generateVocabularyMatching,
  'picture-sequence': generatePictureSequence,
  'word-quiz': generateWordQuiz,
  'odd-one-out': generateOddOneOut,
  'word-writing': generateWordWriting,
  'connect-the-dots': generateConnectTheDots,
  'word-image-matching': generateWordImageMatching,
  'blending-listening': generateBlendingListening,
  'letter-sound': generateLetterSound,
  'initial-sound': generateInitialSound,
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

// --- 단어 매칭: vocabularyImages + keyObjectImages에서 데이터 추출 (AI 불필요) ---
async function generateVocabularyMatching(
  storybook: Storybook,
  config: GameConfig
): Promise<VocabularyMatchingData> {
  const c = config as VocabularyMatchingConfig;
  const pool: VocabularyMatchingItem[] = [];

  // 어휘 이미지 수집
  const vocabImages = storybook.vocabularyImages ?? [];
  for (const vi of vocabImages) {
    if (!vi.success || !vi.imageUrl) continue;
    if (!c.includeCharacters && vi.isCharacter) continue;
    pool.push({
      word: vi.word,
      korean: vi.korean,
      imageUrl: vi.imageUrl,
    });
  }

  // 핵심사물 이미지 수집
  if (c.includeKeyObjects) {
    const koImages = storybook.keyObjectImages ?? [];
    const koObjects = storybook.key_objects ?? [];
    for (const ki of koImages) {
      if (!ki.success || !ki.imageUrl) continue;
      const obj = koObjects.find((o) => o.name === ki.objectName);
      pool.push({
        word: ki.objectName,
        korean: obj?.korean ?? ki.objectName,
        imageUrl: ki.imageUrl,
      });
    }
  }

  // 파닉스 플래시카드 이미지
  const flashcards = storybook.flashcards ?? [];
  for (const fc of flashcards) {
    if (!fc.imageUrl) continue;
    pool.push({
      word: fc.word,
      korean: fc.localWord,
      imageUrl: fc.imageUrl,
      ttsUrl: fc.ttsUrl,
    });
  }

  if (pool.length < 2) {
    throw new AppError(400, '매칭 게임을 만들기 위한 이미지가 부족합니다. (최소 2개 필요)');
  }

  // 셔플 후 itemCount만큼 선택
  const shuffled = pool.sort(() => Math.random() - 0.5);
  const items = shuffled.slice(0, Math.min(c.itemCount, shuffled.length));

  return { type: 'vocabulary-matching', items };
}

// --- 그림 순서 맞추기: 페이지 삽화에서 데이터 추출 (AI 불필요) ---
async function generatePictureSequence(
  storybook: Storybook,
  config: GameConfig
): Promise<PictureSequenceData> {
  const c = config as PictureSequenceConfig;

  const pagesWithIllustration = (storybook.pages ?? []).filter((p) => p.illustrationUrl);
  if (pagesWithIllustration.length < 3) {
    throw new AppError(400, '삽화가 있는 페이지가 3개 이상 필요합니다.');
  }

  // 균등 간격으로 선택
  const count = Math.min(c.imageCount, pagesWithIllustration.length);
  const step = pagesWithIllustration.length / count;
  const selected = Array.from({ length: count }, (_, i) => {
    const idx = Math.min(Math.floor(i * step), pagesWithIllustration.length - 1);
    return pagesWithIllustration[idx];
  });

  const images = selected.map((p, i) => ({
    imageUrl: p.illustrationUrl!,
    correctOrder: i + 1,
    caption: p.text.length > 30 ? p.text.slice(0, 30) + '...' : p.text,
  }));

  return { type: 'picture-sequence', images };
}

// --- 단어 퀴즈: Gemini 텍스트 생성으로 어휘 퀴즈 생성 ---
async function generateWordQuiz(storybook: Storybook, config: GameConfig): Promise<WordQuizData> {
  const c = config as WordQuizConfig;

  // 어휘 목록 수집
  const vocab = storybook.educational_content?.vocabulary ?? [];
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

// --- 다른 것 찾기: Gemini로 카테고리 분류 후 이질 항목 배치 ---
async function generateOddOneOut(storybook: Storybook, config: GameConfig): Promise<OddOneOutData> {
  const c = config as OddOneOutConfig;

  // 이미지가 있는 어휘 수집
  const vocabWithImages = (storybook.vocabularyImages ?? [])
    .filter((v) => v.success && v.imageUrl)
    .map((v) => ({ word: v.word, korean: v.korean, imageUrl: v.imageUrl }));

  const koImages = (storybook.keyObjectImages ?? [])
    .filter((k) => k.success && k.imageUrl)
    .map((k) => {
      const obj = (storybook.key_objects ?? []).find((o) => o.name === k.objectName);
      return { word: k.objectName, korean: obj?.korean ?? k.objectName, imageUrl: k.imageUrl };
    });

  const pool = [...vocabWithImages, ...koImages];

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

  // Gemini 결과를 GameData 형식으로 변환 (이미지 URL 매칭)
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
    // 셔플
    options.sort(() => Math.random() - 0.5);
    return { category: r.category, options, explanation: r.explanation };
  });

  return { type: 'odd-one-out', rounds };
}

// --- 낱말 쓰기: 어휘에서 단어 추출 (AI 불필요) ---
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
    const vocab = storybook.educational_content?.vocabulary ?? [];
    for (const v of vocab) {
      if (selected && !selected.has(v.word)) continue;
      const word = c.language === 'korean' ? v.korean : v.word;
      const displayWord = c.language === 'korean' ? v.word : v.korean;
      const vocabImg = (storybook.vocabularyImages ?? []).find(
        (vi) => vi.word === v.word && vi.success && vi.imageUrl
      );
      items.push({ word, displayWord, imageUrl: vocabImg?.imageUrl, referenceImageUrl: '' });
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

  return { type: 'word-writing', items };
}

// --- 점잇기: 삽화 페이지 추출 (AI 불필요, 키포인트는 저작도구에서 수동 편집) ---
async function generateConnectTheDots(
  storybook: Storybook,
  config: GameConfig
): Promise<ConnectTheDotsData> {
  const c = config as ConnectTheDotsConfig;
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

  // 블렌딩별로 이미지 있는 단어 수집
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
    // wordFamily에서 보충
    const wf = wordFamilies[i];
    if (wf) {
      for (const w of wf.words) {
        if (w.imageUrl && !arr.some((a) => a.word === w.word)) {
          arr.push({ word: w.word, imageUrl: w.imageUrl, ttsUrl: w.ttsUrl });
        }
      }
    }
  }

  // 이미지가 1개 이상인 그룹만, 최대 2개씩
  const qualifying = Array.from(groupMap.entries())
    .filter(([, items]) => items.length >= 1)
    .map(([blend, items]) => ({ blend, items: items.slice(0, 2) }));

  if (qualifying.length < 2) {
    throw new AppError(400, '선긋기 게임에 이미지가 있는 블렌딩 그룹이 2개 이상 필요합니다.');
  }

  // 2개 그룹 선택 — 각 그룹 최소 1개, 합계 최소 2개
  const groups = qualifying.slice(0, 2);
  const totalItems = groups.reduce((s, g) => s + g.items.length, 0);
  if (totalItems < 2) {
    throw new AppError(400, '선긋기 게임에 이미지가 있는 단어가 2개 이상 필요합니다.');
  }

  return { type: 'word-image-matching', groups };
}

// --- 블렌딩 듣기 맞추기: 블렌딩별 단어 쌍을 라운드로 구성 ---
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
    // wordFamily에서 보충
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

  // 셔플
  rounds.sort(() => Math.random() - 0.5);
  return { type: 'blending-listening', rounds };
}

// --- 음가 듣기: Level 1 알파벳 음가 TTS를 듣고 글자 맞추기 ---
async function generateLetterSound(storybook: Storybook): Promise<LetterSoundData> {
  const blending = storybook.phonicsLesson?.blending ?? [];
  const wordFamilies = storybook.phonicsLesson?.wordFamilies ?? [];

  // Level 1 알파벳 항목 중 TTS 있는 것만
  const alphaItems: { letter: string; ttsUrl: string }[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < blending.length; i++) {
    const item = blending[i];
    if (item.vowel.length !== 1 || !/^[A-Za-z]$/.test(item.vowel)) continue;
    const upper = item.vowel.toUpperCase();
    if (seen.has(upper)) continue;

    // Level 1: TTS는 wordFamilies[i].words[j].ttsUrl에 저장됨
    let ttsUrl =
      item.vowelTtsUrl ||
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
    seen.add(upper);
    alphaItems.push({ letter: upper, ttsUrl });
  }

  if (alphaItems.length < 2) {
    throw new AppError(400, '음가 듣기 게임에 TTS가 있는 알파벳이 2개 이상 필요합니다.');
  }

  const shuffled = alphaItems.sort(() => Math.random() - 0.5);
  const rounds: LetterSoundRound[] = shuffled.map((target) => {
    const others = alphaItems.filter((i) => i.letter !== target.letter);
    const distractors = others
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((i) => i.letter);
    const options = [target.letter, ...distractors].sort(() => Math.random() - 0.5);
    return { targetLetter: target.letter, ttsUrl: target.ttsUrl, options };
  });

  return { type: 'letter-sound', rounds };
}

// --- 첫소리 찾기: Level 1 단어 이미지를 보고 첫소리 알파벳 맞추기 ---
async function generateInitialSound(storybook: Storybook): Promise<InitialSoundData> {
  const blending = storybook.phonicsLesson?.blending ?? [];
  const wordFamilies = storybook.phonicsLesson?.wordFamilies ?? [];

  const items: InitialSoundRound[] = [];
  const allLetters = new Set<string>();
  const seenWords = new Set<string>();

  for (let i = 0; i < blending.length; i++) {
    const item = blending[i];
    if (item.vowel.length !== 1 || !/^[A-Za-z]$/.test(item.vowel)) continue;
    const upper = item.vowel.toUpperCase();
    allLetters.add(upper);

    // exampleWordImageUrl 우선
    if (item.exampleWordImageUrl && !seenWords.has(item.exampleWord)) {
      seenWords.add(item.exampleWord);
      items.push({
        letter: upper,
        word: item.exampleWord,
        imageUrl: item.exampleWordImageUrl,
        wordTtsUrl: item.exampleWordTtsUrl,
        options: [], // 아래에서 채움
      });
    }

    // wordFamily에서 보충
    const wf = wordFamilies[i];
    if (wf) {
      for (const w of wf.words) {
        if (!w.imageUrl || seenWords.has(w.word)) continue;
        seenWords.add(w.word);
        items.push({
          letter: upper,
          word: w.word,
          imageUrl: w.imageUrl,
          wordTtsUrl: w.ttsUrl,
          options: [],
        });
      }
    }

    // Level 1 fallback: illustrationUrl (전체 삽화)
    if (!items.some((it) => it.letter === upper) && item.illustrationUrl) {
      const word = item.exampleWord || upper;
      if (!seenWords.has(word)) {
        seenWords.add(word);
        items.push({
          letter: upper,
          word,
          imageUrl: item.illustrationUrl,
          wordTtsUrl: item.exampleWordTtsUrl,
          options: [],
        });
      }
    }
  }

  if (items.length < 2 || allLetters.size < 2) {
    throw new AppError(400, '첫소리 찾기 게임에 이미지가 있는 알파벳이 2개 이상 필요합니다.');
  }

  const letterPool = Array.from(allLetters);

  // 셔플 + 디스트랙터 생성
  items.sort(() => Math.random() - 0.5);
  const rounds: InitialSoundRound[] = items.map((item) => {
    const others = letterPool.filter((l) => l !== item.letter);
    const distractors = others.sort(() => Math.random() - 0.5).slice(0, 3);
    const options = [item.letter, ...distractors].sort(() => Math.random() - 0.5);
    return { ...item, options };
  });

  return { type: 'initial-sound', rounds };
}
