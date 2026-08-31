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
  OrderBlockData,
  OrderBlockItem,
  OrderWritingData,
  VocabularyUnit,
  VocabularyUnitWord,
  Storybook,
} from '@tangobook/shared';
import { decomposeWord, decomposeEnglishWord, splitUnits } from '@tangobook/shared';
import { buildStoryImageData } from '@/features/games/lib/story-image-data';
import { buildPageOrderData } from '@/features/games/lib/page-order-data';
import { buildObjectSceneData } from '@/features/games/lib/object-scene-data';

/** 순서 맞추기 블록 타일 최대 개수 (그리드/트레이 가독성). vi 어절·긴 zh/th 단어 수용 위해 10. */
const MAX_ORDER_UNITS = 10;

/** 표시/게임 단어를 언어별로 고른다. vi/zh/th 는 nameTranslations 우선(없으면 영어 폴백). */
function pickWord(w: VocabularyUnitWord, lang: Lang): string | undefined {
  const raw =
    lang === 'ko'
      ? (w.korean ?? w.word)
      : lang === 'en'
        ? w.word
        : (w.nameTranslations?.[lang] ?? w.word);
  const t = raw?.trim();
  return t || undefined;
}

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
  // ko: 기본 ttsUrl(한국어) → ko 전용. 비-ko: 해당 언어 전용(ttsUrls[lang]).
  // 🔴 vi/zh/th 에 ko `ttsUrl` 폴백 금지 — 베트남 단어를 한국어로 읽어버림.
  if (lang === 'ko') return w.ttsUrl ?? w.ttsUrls?.ko;
  return w.ttsUrls?.[lang] ?? (lang === 'en' ? w.ttsUrl : undefined);
}

/** 단원 → 그림짝(LineMatching) 데이터 — 후보 중 랜덤 N개 (사용자 정책 2026-05-10) */
export function unitToLineMatchingData(
  unit: VocabularyUnit,
  lang: Lang
): KoreanLineMatchingData | EnglishLineMatchingData | null {
  const candidates: LineMatchingItem[] = [];
  for (const w of unit.words) {
    const imageUrl = pickPrimaryImage(w);
    const word = pickWord(w, lang);
    if (!imageUrl || !word) continue;
    const tts = pickTts(w, lang);
    // 단일 언어 정책 (2026-07-13): 게임 화면엔 플레이 언어 단어 하나만 — 다른 언어 뜻(subLabel)
    // 병기 제거. (전에는 ko=영어 / en=한글 을 부제로 병기했음.)
    candidates.push({
      word,
      imageUrl,
      ...(tts ? { ttsUrl: tts } : {}),
    });
  }
  if (candidates.length < 3) return null;
  const items = shuffleInPlace(candidates).slice(0, MATCHING_COUNT);
  return lang === 'ko'
    ? { type: 'korean-line-matching', items }
    : { type: 'english-line-matching', items };
}

/** 단원 → 한글 블록 데이터 — 후보 중 랜덤 N개 (이미지 없는 단어도 포함, 플레이어가 conditional render) */
export function unitToKoreanBlockData(unit: VocabularyUnit): KoreanBlockData | null {
  const candidates: KoreanBlockItem[] = [];
  for (const w of unit.words) {
    const korean = (w.korean ?? '').trim();
    if (!korean || ![...korean].some((c) => HANGUL_RE.test(c))) continue;
    const syllables = decomposeWord(korean);
    if (syllables.length === 0) continue;
    const tts = pickTts(w, 'ko');
    candidates.push({
      word: korean,
      imageUrl: pickPrimaryImage(w) ?? '',
      syllables,
      ...(tts ? { ttsUrl: tts } : {}),
    });
  }
  if (candidates.length === 0) return null;
  return { type: 'korean-block', items: shuffleInPlace(candidates).slice(0, BLOCK_COUNT) };
}

/** 단원 → 영어 블록 데이터 — 후보 중 랜덤 N개 (이미지 없는 단어도 포함) */
export function unitToEnglishBlockData(unit: VocabularyUnit): EnglishBlockData | null {
  const candidates: EnglishBlockItem[] = [];
  for (const w of unit.words) {
    const word = (w.word ?? '').toLowerCase().trim();
    if (!word || !ENGLISH_WORD_RE.test(word) || word.length > MAX_BLOCK_WORD_LEN) continue;
    const tts = pickTts(w, 'en');
    candidates.push({
      word,
      korean: w.korean ?? '',
      imageUrl: pickPrimaryImage(w) ?? '',
      letters: decomposeEnglishWord(word),
      ...(tts ? { ttsUrl: tts } : {}),
    });
  }
  if (candidates.length === 0) return null;
  return { type: 'english-block', items: shuffleInPlace(candidates).slice(0, BLOCK_COUNT) };
}

/**
 * 단원 → 순서 맞추기 블록 데이터 (vi/zh/th). 정답 = nameTranslations[lang] 이 있어야 함
 * (영어 폴백 X — 중국어 판에서 영어 철자를 맞추게 하면 안 됨). 타일 = splitUnits(word, lang).
 */
export function unitToOrderBlockData(unit: VocabularyUnit, lang: Lang): OrderBlockData | null {
  const candidates: OrderBlockItem[] = [];
  for (const w of unit.words) {
    const word = w.nameTranslations?.[lang]?.trim();
    if (!word) continue;
    const units = splitUnits(word, lang);
    if (units.length === 0 || units.length > MAX_ORDER_UNITS) continue;
    // vi/zh/th 는 ko ttsUrl 폴백 금지 — 해당 언어 음원만(현재 없음 → 무음, 나중에 채움).
    const tts = w.ttsUrls?.[lang];
    candidates.push({
      word,
      units,
      imageUrl: pickPrimaryImage(w) ?? '',
      ...(tts ? { ttsUrl: tts } : {}),
    });
  }
  if (candidates.length === 0) return null;
  return { type: 'order-block', lang, items: shuffleInPlace(candidates).slice(0, BLOCK_COUNT) };
}

/**
 * 단원 → 따라쓰기 데이터 (vi/zh/th). 정답 = nameTranslations[lang], 이미지 필요.
 */
export function unitToOrderWritingData(unit: VocabularyUnit, lang: Lang): OrderWritingData | null {
  const candidates: WordWritingItem[] = [];
  for (const w of unit.words) {
    const word = w.nameTranslations?.[lang]?.trim();
    if (!word) continue;
    const referenceImageUrl = pickPrimaryImage(w);
    if (!referenceImageUrl) continue;
    const tts = w.ttsUrls?.[lang];
    candidates.push({
      word,
      displayWord: word,
      imageUrl: referenceImageUrl,
      referenceImageUrl,
      ...(tts ? { ttsUrl: tts } : {}),
    });
  }
  if (candidates.length === 0) return null;
  return { type: 'order-writing', lang, items: shuffleInPlace(candidates).slice(0, WRITING_COUNT) };
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
  /**
   * 카드가 속한 묶음 — 낱말을 소리·글자로 익히는 게임(word) / 책 내용을 묻는 독후활동(story).
   * 🔴 여덟 장을 한 줄에 늘어놓으면 무엇을 고르는 화면인지 안 읽힌다(사용자 2026-09-01).
   */
  group: 'word' | 'story';
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

/** i18n `t` — games 네임스페이스 스코프. 라벨/부제/비활성사유 localize 용. */
type TFn = (key: string) => string;

/**
 * 단원에서 즉시 플레이 가능한 게임 카드. 라벨은 `t`(games ns)로 localize.
 *
 * 🔴 낱말 4종은 `unit` 에서, 「이야기 듣고 그림 찾기」는 `book`(쪽 본문·나레이션·삽화)에서 나온다.
 *    book 이 없으면(커스텀 단원) 이야기 카드는 빠진다 — 회색 카드로 남기면 영영 못 켜는 칸이 된다.
 */
export function getAvailableGames(
  unit: VocabularyUnit,
  lang: Lang,
  t: TFn,
  book?: Storybook,
  style?: string
): VocabGameOption[] {
  const isKo = lang === 'ko';
  const isEn = lang === 'en';
  const isOrder = !isKo && !isEn; // vi/zh/th = 순서 맞추기 계열
  const lineData = unitToLineMatchingData(unit, lang);
  const blockData = isKo
    ? unitToKoreanBlockData(unit)
    : isEn
      ? unitToEnglishBlockData(unit)
      : unitToOrderBlockData(unit, lang);
  const writingData = isOrder
    ? unitToOrderWritingData(unit, lang)
    : unitToWordWritingData(unit, lang);
  const dotsData = unitToConnectTheDotsData(unit);
  const storyData = buildStoryImageData(book, lang, style);
  // 독후활동은 한국어부터. 다른 언어는 카드를 내지 않는다(반쪽만 번역된 화면보다 없는 게 낫다).
  const pageOrderData = isKo ? buildPageOrderData(book, style) : null;
  const objectSceneData = isKo ? buildObjectSceneData(book, style) : null;

  const cards: VocabGameOption[] = [
    {
      id: isKo ? 'korean-line-matching' : 'english-line-matching',
      group: 'word',
      emoji: '🎯',
      label: t('cards.lineMatching.label'),
      subtitle: t('cards.lineMatching.subtitle'),
      iconSrc: '/icons/game/line-matching.webp',
      bgFrom: 'from-coral-400',
      bgTo: 'to-coral-600',
      available: !!lineData,
      unavailableReason: !lineData ? t('cards.unavailable.line') : undefined,
    },
    {
      id: isKo ? 'korean-block' : isEn ? 'english-block' : 'order-block',
      group: 'word',
      emoji: '🧱',
      label: isKo
        ? t('cards.block.labelKo')
        : isEn
          ? t('cards.block.labelEn')
          : t('cards.block.label'),
      subtitle: t('cards.block.subtitle'),
      iconSrc: '/icons/game/korean-block.webp',
      bgFrom: 'from-coral-400',
      bgTo: 'to-coral-600',
      available: !!blockData,
      unavailableReason: !blockData
        ? isKo
          ? t('cards.unavailable.blockKo')
          : isEn
            ? t('cards.unavailable.blockEn')
            : t('cards.unavailable.blockOrder')
        : undefined,
    },
    {
      id: 'connect-the-dots',
      group: 'word',
      emoji: '🪡',
      label: t('cards.connectDots.label'),
      subtitle: t('cards.connectDots.subtitle'),
      iconSrc: '/icons/game/connect-dots.webp',
      bgFrom: 'from-coral-400',
      bgTo: 'to-coral-600',
      available: !!dotsData,
      unavailableReason: !dotsData ? t('cards.unavailable.dots') : undefined,
    },
    {
      id: isKo ? 'korean-word-writing' : isEn ? 'english-word-writing' : 'order-writing',
      group: 'word',
      emoji: '✏️',
      label: t('cards.writing.label'),
      subtitle: t('cards.writing.subtitle'),
      // 한글은 연필이 '나무' 를 쓰는 한글판, 그 외는 알파벳판.
      iconSrc: isKo ? '/icons/game/word-writing-ko.webp' : '/icons/game/word-writing.webp',
      bgFrom: 'from-coral-400',
      bgTo: 'to-coral-600',
      available: !!writingData,
      unavailableReason: !writingData ? t('cards.unavailable.writing') : undefined,
    },
  ];

  // 독후활동 — 이야기를 듣고 그 장면을 고른다. 낱말이 아니라 쪽에서 나오므로
  // key_objects 가 없는 책에서도 뜬다. 책 없이는 만들 수 없어 카드 자체를 안 낸다.
  if (book) {
    cards.push({
      id: isKo ? 'korean-story-image' : 'english-story-image',
      group: 'story',
      emoji: '📖',
      label: t('cards.storyImage.label'),
      subtitle: t('cards.storyImage.subtitle'),
      bgFrom: 'from-coral-400',
      bgTo: 'to-coral-600',
      available: !!storyData,
      unavailableReason: !storyData ? t('cards.unavailable.storyImage') : undefined,
    });
  }

  if (objectSceneData) {
    cards.push({
      id: 'korean-object-scene',
      group: 'story',
      emoji: '🔍',
      label: t('cards.objectScene.label'),
      subtitle: t('cards.objectScene.subtitle'),
      bgFrom: 'from-coral-400',
      bgTo: 'to-coral-600',
      available: true,
    });
  }

  if (pageOrderData) {
    cards.push({
      id: 'korean-page-order',
      group: 'story',
      emoji: '🔢',
      label: t('cards.pageOrder.label'),
      subtitle: t('cards.pageOrder.subtitle'),
      bgFrom: 'from-coral-400',
      bgTo: 'to-coral-600',
      available: true,
    });
  }

  return cards;
}

/** 게임 타입에 맞는 GameData 변환 */
export function getGameData(
  unit: VocabularyUnit,
  lang: Lang,
  gameType: GameTypeId,
  book?: Storybook,
  style?: string
) {
  switch (gameType) {
    case 'korean-story-image':
    case 'english-story-image':
      return buildStoryImageData(book, lang, style);
    case 'korean-page-order':
      return buildPageOrderData(book, style);
    case 'korean-object-scene':
      return buildObjectSceneData(book, style);
    case 'korean-line-matching':
    case 'english-line-matching':
      return unitToLineMatchingData(unit, lang);
    case 'korean-block':
      return unitToKoreanBlockData(unit);
    case 'english-block':
      return unitToEnglishBlockData(unit);
    case 'order-block':
      return unitToOrderBlockData(unit, lang);
    case 'connect-the-dots':
      return unitToConnectTheDotsData(unit);
    case 'korean-word-writing':
    case 'english-word-writing':
      return unitToWordWritingData(unit, lang);
    case 'order-writing':
      return unitToOrderWritingData(unit, lang);
    default:
      return null;
  }
}
