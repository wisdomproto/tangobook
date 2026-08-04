/**
 * 파닉스 storybook → 학습 게임 데이터 어댑터.
 *
 * VocabularyUnit 용 어댑터 (`features/vocabulary-unit/lib/game-data-adapter`) 와 별개.
 * 파닉스는 단어가 `phonicsConfig.targetWords` 에 있고 이미지/keypoints 가 보통 없음.
 *
 * 정책:
 *   - 한글블록 / 낱말쓰기: 이미지/TTS 없어도 작동 → 항상 데이터 반환
 *   - 점잇기 / 매칭: 이미지/keypoints 필수 → 부족하면 `null`
 *
 * 게임 플레이어는 phonics concat 으로 TTS 보강 (storybookId 기반).
 */
import type {
  KoreanBlockData,
  KoreanBlockItem,
  KoreanLineMatchingData,
  EnglishLineMatchingData,
  LineMatchingItem,
  ConnectTheDotsData,
  ConnectTheDotsItem,
  WordWritingData,
  WordWritingItem,
  EnglishBlockData,
  EnglishBlockItem,
  Storybook,
  DotKeypoint,
} from '@tangobook/shared';
import { decomposeWord, decomposeEnglishWord, ENGLISH_PHONICS_CURRICULUM } from '@tangobook/shared';

const MAX_ITEMS = 4;

function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * 단어 → 이미지/TTS/keypoints 끌어쓰기.
 * Phonics 책 저작도구는 핵심단어 탭에서 `flashcards[]` 에 imageUrl 을 저장 — flashcards 를 먼저 본다.
 * 일반 책 호환을 위해 `key_objects[]` 도 fallback.
 */
/**
 * 낱말의 **저작 녹음**(`wordFamilies[].words[].ttsUrl`) — 영어 Book 1 은 "b b bat" 형식이다.
 *
 * 🔴 그림·keypoints 는 `flashcards` 에 있지만 **낱말 음원은 wordFamilies 에** 있다(flashcards.ttsUrl 은
 *    전 권 비어 있다). 이걸 안 보면 게임이 완성 시 concat 으로 밋밋하게 "bat" 만 읽는다(사용자 지적:
 *    "b b bat 이런식으로 나와줘"). 없으면(한글·Book 2 등) undefined → 호출부가 기존대로 concat.
 */
export function wordFamilyTts(sb: Storybook, word: string): string | undefined {
  if (!word) return undefined;
  const w = word.toLowerCase();
  const lesson = (sb as unknown as { phonicsLesson?: { wordFamilies?: unknown[] } }).phonicsLesson;
  for (const fam of (lesson?.wordFamilies ?? []) as Array<{
    words?: Array<{ word?: string; ttsUrl?: string }>;
  }>) {
    for (const wd of fam.words ?? []) {
      if ((wd.word ?? '').toLowerCase() === w && wd.ttsUrl) return wd.ttsUrl;
    }
  }
  return undefined;
}

export function findImageData(
  sb: Storybook,
  word: string
): { imageUrl?: string; ttsUrl?: string; keypoints?: DotKeypoint[] } {
  const asAny = (x: unknown): Record<string, unknown> => x as Record<string, unknown>;
  let imageUrl: string | undefined;
  let ttsUrl: string | undefined;
  let keypoints: DotKeypoint[] | undefined;
  // 1) flashcards 우선 (phonics 책 저작도구가 여기에 저장)
  const cards = (sb.flashcards ?? []).map(asAny);
  const card = cards.find(
    (c) => c['word'] === word || c['localWord'] === word || c['korean'] === word
  );
  if (card) {
    imageUrl = (card['imageUrl'] as string | undefined) ?? (card['url'] as string | undefined);
    ttsUrl = card['ttsUrl'] as string | undefined;
    keypoints = card['keypoints'] as DotKeypoint[] | undefined;
  }
  // 2) key_objects fallback (일반 storybook 호환)
  if (!imageUrl && !ttsUrl && !keypoints) {
    const koList = (sb.key_objects ?? []).map(asAny);
    const ko = koList.find((k) => k['name'] === word || k['korean'] === word);
    if (ko) {
      imageUrl = (ko['imageUrl'] as string | undefined) ?? (ko['url'] as string | undefined);
      ttsUrl = ko['ttsUrl'] as string | undefined;
      keypoints = ko['keypoints'] as DotKeypoint[] | undefined;
    }
  }
  // 🔴 낱말 음원은 **wordFamilies 의 "글자 글자 낱말"(a a apple)을 우선**한다 — flashcard 에 밋밋한
  //    낱말 녹음("apple")이 있어도 그걸 이겨야 Book 1 이 전체적으로 통일된다(사용자: "b b bat 이런식으로").
  //    wordFamilies 에 없으면(한글·Book 2 등) flashcard/key_objects 녹음이나 concat 폴백 그대로.
  return { imageUrl, ttsUrl: wordFamilyTts(sb, word) ?? ttsUrl, keypoints };
}

export function phonicsToKoreanBlockData(sb: Storybook): KoreanBlockData | null {
  const targetWords = sb.phonicsConfig?.targetWords ?? [];
  if (targetWords.length === 0) return null;
  const items: KoreanBlockItem[] = [];
  for (const w of targetWords) {
    const syllables = decomposeWord(w);
    if (syllables.length === 0) continue;
    const extra = findImageData(sb, w);
    items.push({
      word: w,
      imageUrl: extra.imageUrl ?? '',
      ...(extra.ttsUrl ? { ttsUrl: extra.ttsUrl } : {}),
      syllables,
    });
  }
  if (items.length === 0) return null;
  return { type: 'korean-block', items: shuffle(items).slice(0, MAX_ITEMS) };
}

export function phonicsToWordWritingData(sb: Storybook): WordWritingData | null {
  const targetWords = sb.phonicsConfig?.targetWords ?? [];
  if (targetWords.length === 0) return null;
  const alphabet = isAlphabetUnit(sb);
  const items: WordWritingItem[] = targetWords.map((w) => {
    const extra = findImageData(sb, w);
    const target = alphabet ? (w[0] ?? w).toLowerCase() : w;
    return {
      word: target,
      displayWord: target,
      ...(extra.imageUrl ? { imageUrl: extra.imageUrl } : {}),
      referenceImageUrl: extra.imageUrl ?? '', // 미사용 필드 (canvas 가이드는 텍스트로 직접 렌더)
      ...(extra.ttsUrl ? { ttsUrl: extra.ttsUrl } : {}),
    };
  });
  return { type: 'korean-word-writing', items: shuffle(items).slice(0, MAX_ITEMS) };
}

/**
 * 듣고 고르기용 — 그림이 있는 타겟 단어만. 보기가 3장이라 최소 3개가 있어야 문제가 성립한다.
 */
export function phonicsToWordChoices(
  sb: Storybook
): Array<{ word: string; imageUrl: string; ttsUrl?: string }> {
  const targetWords = sb.phonicsConfig?.targetWords ?? [];
  const out: Array<{ word: string; imageUrl: string; ttsUrl?: string }> = [];
  for (const w of targetWords) {
    const extra = findImageData(sb, w);
    if (!extra.imageUrl) continue;
    out.push({
      word: w,
      imageUrl: extra.imageUrl,
      ...(extra.ttsUrl ? { ttsUrl: extra.ttsUrl } : {}),
    });
  }
  return out;
}

export function phonicsToLineMatchingData(sb: Storybook): KoreanLineMatchingData | null {
  const targetWords = sb.phonicsConfig?.targetWords ?? [];
  const candidates: LineMatchingItem[] = [];
  for (const w of targetWords) {
    const extra = findImageData(sb, w);
    if (!extra.imageUrl) continue;
    candidates.push({
      word: w,
      imageUrl: extra.imageUrl,
      ...(extra.ttsUrl ? { ttsUrl: extra.ttsUrl } : {}),
    });
  }
  if (candidates.length < 3) return null;
  return { type: 'korean-line-matching', items: shuffle(candidates).slice(0, MAX_ITEMS) };
}

export function phonicsToConnectTheDotsData(sb: Storybook): ConnectTheDotsData | null {
  const targetWords = sb.phonicsConfig?.targetWords ?? [];
  const candidates: ConnectTheDotsItem[] = [];
  for (const w of targetWords) {
    const extra = findImageData(sb, w);
    if (!extra.imageUrl || !extra.keypoints || extra.keypoints.length < 2) continue;
    candidates.push({
      pageNumber: 0,
      originalImageUrl: extra.imageUrl,
      keypoints: extra.keypoints,
      objectName: w,
      // 알파벳 단원은 완성했을 때 **글자**를 크게 보여주고 `b b book` 클립을 읽어준다.
      ...(isAlphabetUnit(sb)
        ? { letter: `${(w[0] ?? '').toUpperCase()}${(w[0] ?? '').toLowerCase()}` }
        : {}),
      ...(extra.ttsUrl ? { ttsUrl: extra.ttsUrl } : {}),
    });
  }
  if (candidates.length === 0) return null;
  return { type: 'connect-the-dots', items: shuffle(candidates).slice(0, MAX_ITEMS) };
}

// ──────────────────────────────────────────────────────────────────────────
// 영어 파닉스 어댑터 — 영어 단어 (cat, fan, ...) 용
// ──────────────────────────────────────────────────────────────────────────

/**
 * 🔴 **영어 Book 1 은 글자가 단위다** — 그 권의 학습 목표가 알파벳이라, 게임에서 `apple` 철자를
 * 맞추거나 쓰게 하면 아직 못 하는 일을 시키는 셈이다. 블록은 한 칸, 쓰기는 한 글자, 짝 찾기는
 * 그림↔글자로 맞춘다. 단어와 그림은 "무엇으로 시작하는지" 를 보여주는 맥락으로만 남는다.
 */
function isAlphabetUnit(sb: Storybook): boolean {
  return /^en-b1-/.test(sb.id ?? '');
}

/**
 * 알파벳 단원이 배우는 글자 — 블록 게임 하단 패널에 깔 목록.
 *
 * 🔴 **커리큘럼(`phonemes`)에서 가져온다.** 타겟 단어의 첫 글자로 뽑으면 그 단원 단어가 두 글자만
 *    덮을 때 패널이 두 장이 되어 「ABC 배우기」인데 A 가 없다(실제로 그렇게 나왔다).
 * 🔴 Book 2 부터는 **26자 전체**에서 고른다 — 그게 공부다(사용자 결정 2026-07-28). Book 1 만
 *    3~4장으로 좁힌다: 아직 글자를 익히는 중이라 26자 훑기는 찾기 연습이 되어 버린다.
 */
function alphabetUnitLetters(sb: Storybook): string[] | undefined {
  const id = sb.id ?? '';
  for (const book of ENGLISH_PHONICS_CURRICULUM) {
    const unit = book.units.find((u) => u.id === id);
    if (unit) return unit.phonemes.map((p) => p.toLowerCase());
  }
  return undefined;
}

const ENGLISH_WORD_RE = /^[a-z]+$/i;
const MAX_BLOCK_WORD_LEN = 6;

export function phonicsToEnglishBlockData(sb: Storybook): EnglishBlockData | null {
  const targetWords = sb.phonicsConfig?.targetWords ?? [];
  const alphabet = isAlphabetUnit(sb);
  const items: EnglishBlockItem[] = [];
  for (const w of targetWords) {
    const full = w.toLowerCase().trim();
    if (!ENGLISH_WORD_RE.test(full) || full.length > MAX_BLOCK_WORD_LEN) continue;
    const word = alphabet ? full[0] : full;
    const extra = findImageData(sb, w);
    items.push({
      word,
      korean: '',
      imageUrl: extra.imageUrl ?? '',
      ...(extra.ttsUrl ? { ttsUrl: extra.ttsUrl } : {}),
      letters: decomposeEnglishWord(word),
    });
  }
  if (items.length === 0) return null;
  /**
   * 🔴 패널 글자는 **단원 전체**에서 모은다 — `items` 는 이번 판에 뽑힌 4문제뿐이라
   *    b·c 만 걸리면 「ABC 배우기」인데 패널에 A 가 없다(실제로 그렇게 나왔다).
   */
  const panelLetters = alphabet
    ? (alphabetUnitLetters(sb) ?? [...new Set(items.map((i) => i.word))].sort())
    : undefined;
  return {
    type: 'english-block',
    items: shuffle(items).slice(0, MAX_ITEMS),
    ...(panelLetters ? { panelLetters } : {}),
  };
}

export function phonicsToEnglishWordWritingData(sb: Storybook): WordWritingData | null {
  const targetWords = sb.phonicsConfig?.targetWords ?? [];
  if (targetWords.length === 0) return null;
  const alphabet = isAlphabetUnit(sb);
  const items: WordWritingItem[] = targetWords.map((w) => {
    const extra = findImageData(sb, w);
    // 🔴 Book 1 은 **낱말 전체(apple)를 그리되 첫 글자(a)만** 쓴다 — 한 글자를 쓰면 낱말이 화면에 있다.
    //    예전엔 word 를 글자 하나로 줄여 낱말이 아예 안 보였다(사용자: "한개 알파벳 쓰면 단어가 나와야지").
    const drawWord = w.toLowerCase();
    return {
      word: drawWord,
      displayWord: drawWord,
      ...(alphabet ? { traceWord: (w[0] ?? w).toLowerCase() } : {}),
      ...(extra.imageUrl ? { imageUrl: extra.imageUrl } : {}),
      referenceImageUrl: extra.imageUrl ?? '',
      ...(extra.ttsUrl ? { ttsUrl: extra.ttsUrl } : {}),
    };
  });
  return { type: 'english-word-writing', items: shuffle(items).slice(0, MAX_ITEMS) };
}

/**
 * 유닛 페이지 게임 타일 노출 판정.
 *
 * 🔴 ActivityPage 의 dispatch 와 **같은 어댑터를 그대로** 호출한다 — 판정 로직을 따로 쓰면
 * "타일은 보이는데 눌러보면 '단어 그림이 필요해요'" 라는 막다른 길이 다시 생긴다.
 * 실제로 71 유닛 중 그림짝은 3개, 점잇기는 0개만 데이터가 있어서 그 대부분이 막다른 길이었다.
 *
 * `sb` 미로딩(undefined) 이면 데이터 의존 게임은 숨긴 채로 두고, 로드 후 나타나게 한다
 * (반대로 하면 대부분의 유닛에서 타일이 떴다가 사라지는 깜빡임이 생긴다).
 * 학습(learn) 활동은 storybook 데이터에 의존하지 않으므로 항상 true.
 */
export function isPhonicsActivityAvailable(kind: string, sb: Storybook | undefined): boolean {
  if (!kind.startsWith('game-')) return true;
  if (!sb) return false;
  switch (kind) {
    case 'game-korean-block':
      return phonicsToKoreanBlockData(sb) !== null;
    case 'game-english-block':
      return phonicsToEnglishBlockData(sb) !== null;
    // 낱말 쓰기는 ko/en 모두 targetWords 만 요구 — 어댑터 로직이 동일해 한쪽만 호출.
    case 'game-word-writing':
      return phonicsToWordWritingData(sb) !== null;
    case 'game-connect-dots':
      return phonicsToConnectTheDotsData(sb) !== null;
    // 그림 짝 찾기도 ko/en 판정 기준(이미지 3장 이상)이 같다.
    case 'game-line-matching':
      return phonicsToLineMatchingData(sb) !== null;
    default:
      return true;
  }
}

export function phonicsToEnglishLineMatchingData(sb: Storybook): EnglishLineMatchingData | null {
  const targetWords = sb.phonicsConfig?.targetWords ?? [];
  const alphabet = isAlphabetUnit(sb);
  const candidates: LineMatchingItem[] = [];
  const usedLetters = new Set<string>();
  for (const w of targetWords) {
    const extra = findImageData(sb, w);
    if (!extra.imageUrl) continue;
    if (alphabet) {
      // 🔴 알파벳 단원은 **그림 ↔ 글자** 로 잇는다. 같은 글자가 두 번 나오면 정답이 둘이 되므로
      //    글자당 한 장만 남긴다(단어는 그림 아래 라벨로 맥락만).
      const letter = (w[0] ?? '').toLowerCase();
      if (!letter || usedLetters.has(letter)) continue;
      usedLetters.add(letter);
      candidates.push({
        word: `${letter.toUpperCase()}${letter}`,
        imageUrl: extra.imageUrl,
        imageLabel: w,
        ...(extra.ttsUrl ? { ttsUrl: extra.ttsUrl } : {}),
      });
      continue;
    }
    candidates.push({
      word: w,
      imageUrl: extra.imageUrl,
      ...(extra.ttsUrl ? { ttsUrl: extra.ttsUrl } : {}),
    });
  }
  if (candidates.length < 3) return null;
  return { type: 'english-line-matching', items: shuffle(candidates).slice(0, MAX_ITEMS) };
}
