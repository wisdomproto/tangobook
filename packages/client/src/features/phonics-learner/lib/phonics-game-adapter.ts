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
import { decomposeWord, decomposeEnglishWord } from '@tangobook/shared';

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
function findImageData(
  sb: Storybook,
  word: string
): { imageUrl?: string; ttsUrl?: string; keypoints?: DotKeypoint[] } {
  const asAny = (x: unknown): Record<string, unknown> => x as Record<string, unknown>;
  // 1) flashcards 우선 (phonics 책 저작도구가 여기에 저장)
  const cards = (sb.flashcards ?? []).map(asAny);
  const card = cards.find(
    (c) => c['word'] === word || c['localWord'] === word || c['korean'] === word
  );
  if (card) {
    const imageUrl =
      (card['imageUrl'] as string | undefined) ?? (card['url'] as string | undefined);
    const ttsUrl = card['ttsUrl'] as string | undefined;
    const keypoints = card['keypoints'] as DotKeypoint[] | undefined;
    if (imageUrl || ttsUrl || keypoints) return { imageUrl, ttsUrl, keypoints };
  }
  // 2) key_objects fallback (일반 storybook 호환)
  const koList = (sb.key_objects ?? []).map(asAny);
  const ko = koList.find((k) => k['name'] === word || k['korean'] === word);
  if (!ko) return {};
  const koImageUrl = (ko['imageUrl'] as string | undefined) ?? (ko['url'] as string | undefined);
  const koTtsUrl = ko['ttsUrl'] as string | undefined;
  const koKeypoints = ko['keypoints'] as DotKeypoint[] | undefined;
  return { imageUrl: koImageUrl, ttsUrl: koTtsUrl, keypoints: koKeypoints };
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
  const items: WordWritingItem[] = targetWords.map((w) => {
    const extra = findImageData(sb, w);
    return {
      word: w,
      displayWord: w,
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
    });
  }
  if (candidates.length === 0) return null;
  return { type: 'connect-the-dots', items: shuffle(candidates).slice(0, MAX_ITEMS) };
}

// ──────────────────────────────────────────────────────────────────────────
// 영어 파닉스 어댑터 — 영어 단어 (cat, fan, ...) 용
// ──────────────────────────────────────────────────────────────────────────

const ENGLISH_WORD_RE = /^[a-z]+$/i;
const MAX_BLOCK_WORD_LEN = 6;

export function phonicsToEnglishBlockData(sb: Storybook): EnglishBlockData | null {
  const targetWords = sb.phonicsConfig?.targetWords ?? [];
  const items: EnglishBlockItem[] = [];
  for (const w of targetWords) {
    const word = w.toLowerCase().trim();
    if (!ENGLISH_WORD_RE.test(word) || word.length > MAX_BLOCK_WORD_LEN) continue;
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
  return { type: 'english-block', items: shuffle(items).slice(0, MAX_ITEMS) };
}

export function phonicsToEnglishWordWritingData(sb: Storybook): WordWritingData | null {
  const targetWords = sb.phonicsConfig?.targetWords ?? [];
  if (targetWords.length === 0) return null;
  const items: WordWritingItem[] = targetWords.map((w) => {
    const extra = findImageData(sb, w);
    return {
      word: w,
      displayWord: w,
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
  return { type: 'english-line-matching', items: shuffle(candidates).slice(0, MAX_ITEMS) };
}
