import type {
  Lang,
  GameTypeId,
  LineMatchingItem,
  KoreanBlockData,
  KoreanBlockItem,
  EnglishBlockData,
  EnglishBlockItem,
  KoreanLineMatchingData,
  EnglishLineMatchingData,
  WordWritingData,
  WordWritingItem,
  ConnectTheDotsData,
  ConnectTheDotsItem,
  VocabularyUnit,
  VocabularyUnitWord,
} from '@tangobook/shared';
import { decomposeWord, decomposeEnglishWord } from '@tangobook/shared';

const HANGUL_RE = /[가-힣]/;
const ENGLISH_WORD_RE = /^[a-z]+$/;
const MAX_BLOCK_WORD_LEN = 6;
const MATCHING_COUNT = 4;
const BLOCK_COUNT = 3;
const WRITING_COUNT = 3;
const DOTS_COUNT = 3;

/** Fisher-Yates 셔플 (in-place). 게임 데이터 랜덤 sampling 통일. */
function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickPrimaryImage(w: VocabularyUnitWord): string | undefined {
  return w.images?.find((im) => im.isPrimary)?.imageUrl ?? w.images?.[0]?.imageUrl;
}

function pickTts(w: VocabularyUnitWord, lang: Lang): string | undefined {
  return w.ttsUrl ?? w.ttsUrls?.[lang];
}

/** 단원 → 그림짝(LineMatching) 데이터 — 후보 중 랜덤 N개 (사용자 정책 2026-05-10) */
export function unitToLineMatchingData(
  unit: VocabularyUnit,
  lang: Lang
): KoreanLineMatchingData | EnglishLineMatchingData | null {
  const candidates: LineMatchingItem[] = [];
  for (const w of unit.words) {
    const imageUrl = pickPrimaryImage(w);
    const word = lang === 'ko' ? (w.korean ?? w.word) : w.word;
    if (!imageUrl || !word) continue;
    const tts = pickTts(w, lang);
    const subLabel =
      lang === 'ko' ? (w.nameEn ?? (w.word !== word ? w.word : '')) : (w.korean ?? '');
    candidates.push({
      word,
      imageUrl,
      ...(tts ? { ttsUrl: tts } : {}),
      ...(subLabel ? { subLabel } : {}),
    });
  }
  if (candidates.length < 3) return null;
  const items = shuffleInPlace(candidates).slice(0, MATCHING_COUNT);
  return lang === 'ko'
    ? { type: 'korean-line-matching', items }
    : { type: 'english-line-matching', items };
}

/** 단원 → 한글 블록 데이터 — 후보 중 랜덤 N개 */
export function unitToKoreanBlockData(unit: VocabularyUnit): KoreanBlockData | null {
  const candidates: KoreanBlockItem[] = [];
  for (const w of unit.words) {
    const korean = (w.korean ?? '').trim();
    if (!korean || ![...korean].some((c) => HANGUL_RE.test(c))) continue;
    const imageUrl = pickPrimaryImage(w);
    if (!imageUrl) continue;
    const syllables = decomposeWord(korean);
    if (syllables.length === 0) continue;
    const tts = pickTts(w, 'ko');
    candidates.push({
      word: korean,
      imageUrl,
      syllables,
      ...(tts ? { ttsUrl: tts } : {}),
    });
  }
  if (candidates.length === 0) return null;
  return { type: 'korean-block', items: shuffleInPlace(candidates).slice(0, BLOCK_COUNT) };
}

/** 단원 → 영어 블록 데이터 — 후보 중 랜덤 N개 */
export function unitToEnglishBlockData(unit: VocabularyUnit): EnglishBlockData | null {
  const candidates: EnglishBlockItem[] = [];
  for (const w of unit.words) {
    const word = (w.word ?? '').toLowerCase().trim();
    if (!word || !ENGLISH_WORD_RE.test(word) || word.length > MAX_BLOCK_WORD_LEN) continue;
    const imageUrl = pickPrimaryImage(w);
    if (!imageUrl) continue;
    const tts = pickTts(w, 'en');
    candidates.push({
      word,
      korean: w.korean ?? '',
      imageUrl,
      letters: decomposeEnglishWord(word),
      ...(tts ? { ttsUrl: tts } : {}),
    });
  }
  if (candidates.length === 0) return null;
  return { type: 'english-block', items: shuffleInPlace(candidates).slice(0, BLOCK_COUNT) };
}

/**
 * 단원 → 점잇기(ConnectTheDots) 데이터 — 단어 이미지에 keypoints 가 있는 항목만.
 *
 * VocabularyWordImage.keypoints 는 KeyObject 와 동일 패턴으로 단어 이미지 윤곽선을 점으로 표시.
 * 어휘 단원에 page 개념이 없으므로 pageNumber=0 placeholder. ConnectTheDotsPlayer 내부의
 * useStorybook(storybookId) lookup 은 storybook source 단원에서만 정상 작동 (custom 단원은
 * landing 단계에서 disable 처리).
 *
 * 사용자 정책 (2026-05-10): keypoints 있는 후보 단어 중 **랜덤 N개** (매 라운드 다른 단어).
 */
export function unitToConnectTheDotsData(unit: VocabularyUnit): ConnectTheDotsData | null {
  const candidates: ConnectTheDotsItem[] = [];
  for (const w of unit.words) {
    const img = w.images?.find((im) => im.isPrimary) ?? w.images?.[0];
    if (!img?.keypoints || img.keypoints.length < 2) continue;
    candidates.push({
      pageNumber: 0,
      originalImageUrl: img.imageUrl,
      keypoints: img.keypoints,
      // KeyObject 매칭용 영어 이름 — name 이 'Cow' 같은 capitalized 도 OK (player 에서 lowercase 비교)
      objectName: w.nameEn ?? w.word,
    });
  }
  if (candidates.length === 0) return null;
  return { type: 'connect-the-dots', items: shuffleInPlace(candidates).slice(0, DOTS_COUNT) };
}

/** 단원 → 낱말쓰기 데이터 — 후보 중 랜덤 N개 */
export function unitToWordWritingData(unit: VocabularyUnit, lang: Lang): WordWritingData | null {
  const candidates: WordWritingItem[] = [];
  for (const w of unit.words) {
    const word = lang === 'ko' ? (w.korean ?? w.word) : w.word;
    if (!word) continue;
    const referenceImageUrl = pickPrimaryImage(w);
    if (!referenceImageUrl) continue;
    const tts = pickTts(w, lang);
    candidates.push({
      word,
      displayWord: word,
      imageUrl: referenceImageUrl,
      referenceImageUrl,
      ...(tts ? { ttsUrl: tts } : {}),
    });
  }
  if (candidates.length === 0) return null;
  const items = shuffleInPlace(candidates).slice(0, WRITING_COUNT);
  return lang === 'ko'
    ? { type: 'korean-word-writing', items }
    : { type: 'english-word-writing', items };
}

export interface VocabGameOption {
  id: GameTypeId;
  emoji: string;
  label: string;
  /** 게임 카드 일러스트 (`public/icons/game/*.png`). emoji 는 fallback. */
  iconSrc?: string;
  /** 카드 라벨 아래 부제 (4-5세 친화 가이드 문구). */
  subtitle?: string;
  bgFrom: string;
  bgTo: string;
  available: boolean;
  unavailableReason?: string;
}

/** 단원에서 즉시 플레이 가능한 게임 4종 */
export function getAvailableGames(unit: VocabularyUnit, lang: Lang): VocabGameOption[] {
  const lineData = unitToLineMatchingData(unit, lang);
  const blockData = lang === 'ko' ? unitToKoreanBlockData(unit) : unitToEnglishBlockData(unit);
  const writingData = unitToWordWritingData(unit, lang);
  const dotsData = unitToConnectTheDotsData(unit);
  const isKo = lang === 'ko';

  return [
    {
      id: isKo ? 'korean-line-matching' : 'english-line-matching',
      emoji: '🎯',
      label: '그림짝 맞추기',
      subtitle: '그림과 단어를 짝지어 보세요!',
      iconSrc: '/icons/game/line-matching.png',
      bgFrom: 'from-coral-400',
      bgTo: 'to-coral-600',
      available: !!lineData,
      unavailableReason: !lineData ? '이미지 있는 단어가 3개 이상 필요해요' : undefined,
    },
    {
      id: isKo ? 'korean-block' : 'english-block',
      emoji: '🧱',
      label: isKo ? '한글 블록' : '영어 블록',
      subtitle: '글자 블록으로 단어를 만들어요!',
      iconSrc: '/icons/game/korean-block.png',
      bgFrom: 'from-coral-400',
      bgTo: 'to-coral-600',
      available: !!blockData,
      unavailableReason: !blockData
        ? isKo
          ? '한글 단어가 부족해요'
          : '6글자 이하 영문 단어가 부족해요'
        : undefined,
    },
    {
      id: 'connect-the-dots',
      emoji: '🪡',
      label: '단어 그림 그리기',
      subtitle: '점을 이어 단어를 그려 보세요!',
      iconSrc: '/icons/game/connect-dots.png',
      bgFrom: 'from-coral-400',
      bgTo: 'to-coral-600',
      available: !!dotsData,
      unavailableReason: !dotsData ? '윤곽선 점이 있는 단어가 필요해요' : undefined,
    },
    {
      id: isKo ? 'korean-word-writing' : 'english-word-writing',
      emoji: '✏️',
      label: '따라 쓰기',
      subtitle: '손가락으로 글자를 따라써요!',
      iconSrc: '/icons/game/word-writing.png',
      bgFrom: 'from-coral-400',
      bgTo: 'to-coral-600',
      available: !!writingData,
      unavailableReason: !writingData ? '이미지 있는 단어가 부족해요' : undefined,
    },
  ];
}

/** 게임 타입에 맞는 GameData 변환 */
export function getGameData(unit: VocabularyUnit, lang: Lang, gameType: GameTypeId) {
  switch (gameType) {
    case 'korean-line-matching':
    case 'english-line-matching':
      return unitToLineMatchingData(unit, lang);
    case 'korean-block':
      return unitToKoreanBlockData(unit);
    case 'english-block':
      return unitToEnglishBlockData(unit);
    case 'connect-the-dots':
      return unitToConnectTheDotsData(unit);
    case 'korean-word-writing':
    case 'english-word-writing':
      return unitToWordWritingData(unit, lang);
    default:
      return null;
  }
}
