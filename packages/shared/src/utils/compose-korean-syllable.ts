import type {
  KoreanJamoEntry,
  KoreanJamoVariantKey,
  LetterTracingData,
  TracingStroke,
} from '../types/storybook.js';

/**
 * 한글 음절 → 자모 variant lookup + 박스 transform 으로 stroke 자동 합성.
 *
 * 자모 51 × variant (자음 5, 모음 2) base stroke 정의 → ~3000+ 음절 자동 생성.
 * 음절 케이스 4 (수평/수직 모음 × 받침 유무) + 종성 = variant 결정.
 *
 * variant 없으면 같은 자모의 다른 variant fallback. 모두 없으면 빈 strokes (음절 부분 skip).
 */

type BBox = [x1: number, y1: number, x2: number, y2: number];

/**
 * 수직(세로) 모음 — cho/jung 이 위/아래로 분할되는 케이스.
 * 복모음 (ㅘ ㅝ ㅢ 등) 은 사실 수직+수평 합성이지만 한글 폰트 layout 상 cho 좌 + jung 우 (horizontal) 로 배치.
 */
const VERTICAL_VOWELS = new Set(['ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ']);

const CHO = [
  'ㄱ',
  'ㄲ',
  'ㄴ',
  'ㄷ',
  'ㄸ',
  'ㄹ',
  'ㅁ',
  'ㅂ',
  'ㅃ',
  'ㅅ',
  'ㅆ',
  'ㅇ',
  'ㅈ',
  'ㅉ',
  'ㅊ',
  'ㅋ',
  'ㅌ',
  'ㅍ',
  'ㅎ',
];
const JUNG = [
  'ㅏ',
  'ㅐ',
  'ㅑ',
  'ㅒ',
  'ㅓ',
  'ㅔ',
  'ㅕ',
  'ㅖ',
  'ㅗ',
  'ㅘ',
  'ㅙ',
  'ㅚ',
  'ㅛ',
  'ㅜ',
  'ㅝ',
  'ㅞ',
  'ㅟ',
  'ㅠ',
  'ㅡ',
  'ㅢ',
  'ㅣ',
];
const JONG = [
  '',
  'ㄱ',
  'ㄲ',
  'ㄳ',
  'ㄴ',
  'ㄵ',
  'ㄶ',
  'ㄷ',
  'ㄹ',
  'ㄺ',
  'ㄻ',
  'ㄼ',
  'ㄽ',
  'ㄾ',
  'ㄿ',
  'ㅀ',
  'ㅁ',
  'ㅂ',
  'ㅄ',
  'ㅅ',
  'ㅆ',
  'ㅇ',
  'ㅈ',
  'ㅊ',
  'ㅋ',
  'ㅌ',
  'ㅍ',
  'ㅎ',
];

export interface DecomposedSyllable {
  cho: string;
  jung: string;
  jong: string | null;
}

export function decomposeKoreanSyllable(syllable: string): DecomposedSyllable | null {
  if (!syllable || syllable.length === 0) return null;
  const code = syllable.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return null;
  const offset = code - 0xac00;
  const jongIdx = offset % 28;
  const jungIdx = ((offset - jongIdx) / 28) % 21;
  const choIdx = ((offset - jongIdx) / 28 - jungIdx) / 21;
  return {
    cho: CHO[choIdx] ?? '',
    jung: JUNG[jungIdx] ?? '',
    jong: JONG[jongIdx] || null,
  };
}

export function chooseSyllableLayout(
  jung: string,
  jong: string | null
): { cho: BBox; jung: BBox; jong: BBox | null } {
  const isVertical = VERTICAL_VOWELS.has(jung);
  const has = !!jong;
  if (isVertical && has) {
    return { cho: [0, 0, 1, 0.42], jung: [0, 0.42, 1, 0.72], jong: [0, 0.72, 1, 1] };
  }
  if (isVertical && !has) {
    return { cho: [0, 0, 1, 0.5], jung: [0, 0.5, 1, 1], jong: null };
  }
  if (!isVertical && has) {
    return { cho: [0, 0, 0.5, 0.7], jung: [0.5, 0, 1, 0.7], jong: [0, 0.7, 1, 1] };
  }
  return { cho: [0, 0, 0.5, 1], jung: [0.5, 0, 1, 1], jong: null };
}

/** 음절 케이스 + 위치 → 자모 variant key. */
export function variantKeyFor(
  position: 'cho' | 'jung' | 'jong',
  jung: string,
  jong: string | null
): KoreanJamoVariantKey {
  if (position === 'jong') return 'jong';
  if (position === 'jung') return jong ? 'vowel-hasJong' : 'vowel-noJong';
  // cho
  const isVertical = VERTICAL_VOWELS.has(jung);
  if (isVertical) return jong ? 'cho-vert-hasJong' : 'cho-vert-noJong';
  return jong ? 'cho-horiz-hasJong' : 'cho-horiz-noJong';
}

/**
 * 자모 entry 에서 variant lookup.
 * 우선: 정확한 variant → 같은 group (cho/vowel/jong) 내 다른 variant → 첫 번째 variant → null.
 */
export function lookupJamoVariant(
  entry: KoreanJamoEntry | undefined,
  key: KoreanJamoVariantKey
): LetterTracingData | null {
  if (!entry || !entry.variants) return null;
  const exact = entry.variants[key];
  if (exact) return exact;
  // 같은 group fallback (cho-* / vowel-* / jong)
  const group = key.startsWith('cho-') ? 'cho-' : key.startsWith('vowel-') ? 'vowel-' : 'jong';
  for (const k of Object.keys(entry.variants) as KoreanJamoVariantKey[]) {
    if (group === 'jong' ? k === 'jong' : k.startsWith(group)) {
      const v = entry.variants[k];
      if (v) return v;
    }
  }
  // 마지막 fallback — 어떤 variant 든
  for (const v of Object.values(entry.variants)) {
    if (v) return v;
  }
  return null;
}

function transformStrokes(strokes: TracingStroke[], box: BBox): TracingStroke[] {
  const [bx, by, bx2, by2] = box;
  const bw = bx2 - bx;
  const bh = by2 - by;
  return strokes.map((s) => ({
    type: s.type,
    points: s.points.map((p) => ({
      x: bx + p.x * bw,
      y: by + p.y * bh,
    })),
  }));
}

/**
 * 한글 음절 → 합성된 stroke (LetterTracingData).
 * 자모 또는 variant 가 부족하면 null. enforceOrder=true (cho→jung→jong 순).
 */
export function composeKoreanSyllable(
  syllable: string,
  jamoLib: Record<string, KoreanJamoEntry>
): LetterTracingData | null {
  const decomp = decomposeKoreanSyllable(syllable);
  if (!decomp) return null;
  const { cho, jung, jong } = decomp;
  const layout = chooseSyllableLayout(jung, jong);

  const choData = lookupJamoVariant(jamoLib[cho], variantKeyFor('cho', jung, jong));
  const jungData = lookupJamoVariant(jamoLib[jung], variantKeyFor('jung', jung, jong));
  if (!choData || !jungData) return null;

  const strokes: TracingStroke[] = [
    ...transformStrokes(choData.strokes, layout.cho),
    ...transformStrokes(jungData.strokes, layout.jung),
  ];
  if (jong && layout.jong) {
    const jongData = lookupJamoVariant(jamoLib[jong], variantKeyFor('jong', jung, jong));
    if (jongData) {
      strokes.push(...transformStrokes(jongData.strokes, layout.jong));
    }
  }
  return { strokes, enforceOrder: true };
}

/** 한글 자모 목록 — 편집 페이지 grid 섹션 분류용. */
export const KOREAN_JAMO_GROUPS = {
  singleConsonants: [
    'ㄱ',
    'ㄴ',
    'ㄷ',
    'ㄹ',
    'ㅁ',
    'ㅂ',
    'ㅅ',
    'ㅇ',
    'ㅈ',
    'ㅊ',
    'ㅋ',
    'ㅌ',
    'ㅍ',
    'ㅎ',
  ],
  doubleConsonants: ['ㄲ', 'ㄸ', 'ㅃ', 'ㅆ', 'ㅉ'],
  compoundFinals: ['ㄳ', 'ㄵ', 'ㄶ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅄ'],
  basicVowels: ['ㅏ', 'ㅑ', 'ㅓ', 'ㅕ', 'ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ', 'ㅣ'],
  compoundVowels: ['ㅐ', 'ㅒ', 'ㅔ', 'ㅖ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅢ'],
} as const;

export const ALL_KOREAN_JAMO: string[] = [
  ...KOREAN_JAMO_GROUPS.singleConsonants,
  ...KOREAN_JAMO_GROUPS.doubleConsonants,
  ...KOREAN_JAMO_GROUPS.compoundFinals,
  ...KOREAN_JAMO_GROUPS.basicVowels,
  ...KOREAN_JAMO_GROUPS.compoundVowels,
];

/** 자모가 자음인지 모음인지 판별 — variant key 집합 결정용. */
export function isVowelJamo(jamo: string): boolean {
  const vowels = [
    ...KOREAN_JAMO_GROUPS.basicVowels,
    ...KOREAN_JAMO_GROUPS.compoundVowels,
  ] as readonly string[];
  return vowels.includes(jamo);
}

/** 자모 종류에 따라 적용 가능한 variant 키 목록. */
export function variantsForJamo(jamo: string): KoreanJamoVariantKey[] {
  if (isVowelJamo(jamo)) {
    return ['vowel-noJong', 'vowel-hasJong'];
  }
  // 겹받침 (ㄳ ㄵ ㄶ ㄺ ㄻ ㄼ ㄽ ㄾ ㄿ ㅀ ㅄ) 은 종성으로만 사용
  if ((KOREAN_JAMO_GROUPS.compoundFinals as readonly string[]).includes(jamo)) {
    return ['jong'];
  }
  // 단자음 + 쌍자음 — cho 4 variant + jong
  return ['cho-horiz-noJong', 'cho-horiz-hasJong', 'cho-vert-noJong', 'cho-vert-hasJong', 'jong'];
}

/** variant 키의 한글 라벨 (UI 표시용). */
export const VARIANT_LABELS: Record<KoreanJamoVariantKey, { short: string; example: string }> = {
  'cho-horiz-noJong': { short: '수평 / 받침X', example: '가' },
  'cho-horiz-hasJong': { short: '수평 / 받침O', example: '각' },
  'cho-vert-noJong': { short: '수직 / 받침X', example: '고' },
  'cho-vert-hasJong': { short: '수직 / 받침O', example: '국' },
  jong: { short: '종성', example: '각' },
  'vowel-noJong': { short: '받침X', example: '가' },
  'vowel-hasJong': { short: '받침O', example: '각' },
};
