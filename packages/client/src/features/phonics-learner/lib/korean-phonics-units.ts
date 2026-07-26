/**
 * 한글 파닉스 학습자 메타 — 사이드 진입용 unit 목록 + 단원별 활동 구성.
 *
 * 데이터 source: 저작도구의 `KOREAN_PHONICS_CURRICULUM` (`@tangobook/shared`).
 * R2 storybook ID 는 `kr-hN-uMM` 형식 (zero-pad).
 *
 * 활동 구성은 unit 마다 다를 수 있어 `KOREAN_UNIT_ACTIVITY_PLAN` 으로 분리.
 * 32 단원 전부 작성됨 — 한글1 은 명시 매핑, 한글2~4 는 `derivedPlans()` 가 커리큘럼에서 파생.
 */
import { KOREAN_PHONICS_CURRICULUM, composeHangul } from '@tangobook/shared';

export interface KoreanUnitSummary {
  id: string; // 'kr-h1-u01'
  levelKey: string; // 'hangul1'
  levelName: string; // '한글1: 기본음절'
  levelIndex: number; // 1
  unitIndexInLevel: number; // 1 (1-based)
  unitTitle: string; // 'unit 01: 모음 배우기'
  phonemes: string[];
  targetWords: string[];
  /** 복습 단원인가 (커리큘럼에 없는 파생 단원). */
  isReview?: boolean;
  /** 복습 단원이 되짚는 학습 단원 ID 들. */
  coveredUnitIds?: string[];
}

/** 커리큘럼 단원만 (복습 제외) — 복습 묶음을 만드는 원본. */
function getCurriculumUnits(): KoreanUnitSummary[] {
  const out: KoreanUnitSummary[] = [];
  for (const level of KOREAN_PHONICS_CURRICULUM) {
    const levelIndex = Number(String(level.level).replace(/\D/g, '')) || 0;
    for (let i = 0; i < level.units.length; i++) {
      const u = level.units[i];
      out.push({
        id: u.id,
        levelKey: String(level.level),
        levelName: level.name,
        levelIndex,
        unitIndexInLevel: i + 1,
        unitTitle: u.title,
        phonemes: [...u.phonemes],
        targetWords: [...(u.sampleWords ?? [])],
      });
    }
  }
  return out;
}

/**
 * 복습 묶음 규칙 — 레벨 안에서 **4단원씩**, 남은 게 2 이하면 앞 묶음에 합친다.
 *
 * 🔴 모음 단원(글자가 10개)은 묶음에서 제외한다. 복습 화면은 묶음의 글자를 카드로 한 번에 펼치는데,
 *    10장이 들어오면 4~7세 화면에서 카드가 손톱만해진다. 모음은 자체 활동에 이미 퀴즈가 있고
 *    이후 모든 음절에서 계속 다시 나온다. (판정은 id 하드코딩이 아니라 phonemes 개수로 — 데이터가 늘어도 유지된다.)
 */
const MAX_REVIEW_CARDS = 6;
const REVIEW_CHUNK = 4;

function chunkForReview(units: KoreanUnitSummary[]): KoreanUnitSummary[][] {
  const eligible = units.filter((u) => u.phonemes.length <= 4);
  const groups: KoreanUnitSummary[][] = [];
  for (let i = 0; i < eligible.length; i += REVIEW_CHUNK) {
    groups.push(eligible.slice(i, i + REVIEW_CHUNK));
  }
  // 꼬리가 1~2단원이면 앞 묶음에 합친다 — 단원 2개짜리 복습은 복습 같지가 않다.
  if (groups.length >= 2 && groups[groups.length - 1].length <= 2) {
    const tail = groups.pop()!;
    groups[groups.length - 1].push(...tail);
  }
  return groups.filter((g) => g.length > 0);
}

/**
 * 모든 한글 unit + 복습 단원을 학습 순서대로.
 * 복습은 그 묶음 마지막 단원 **뒤에** 끼어든다 (사이드바에서 단원처럼 보인다).
 */
export function getAllKoreanUnits(): KoreanUnitSummary[] {
  const curriculum = getCurriculumUnits();
  const out: KoreanUnitSummary[] = [];

  for (const level of KOREAN_PHONICS_CURRICULUM) {
    const levelKey = String(level.level);
    const levelUnits = curriculum.filter((u) => u.levelKey === levelKey);
    const groups = chunkForReview(levelUnits);
    // 묶음의 마지막 단원 id → 그 뒤에 붙일 복습 단원
    const reviewAfter = new Map<string, KoreanUnitSummary>();
    groups.forEach((group, gi) => {
      const last = group[group.length - 1];
      const levelIndex = last.levelIndex;
      reviewAfter.set(last.id, {
        id: `kr-h${levelIndex}-r${gi + 1}`,
        levelKey,
        levelName: level.name,
        levelIndex,
        unitIndexInLevel: last.unitIndexInLevel,
        unitTitle: `복습 ${gi + 1}`,
        phonemes: group.map((u) => u.phonemes[0]).filter(Boolean),
        targetWords: group.flatMap((u) => u.targetWords),
        isReview: true,
        coveredUnitIds: group.map((u) => u.id),
      });
    });

    for (const u of levelUnits) {
      out.push(u);
      const review = reviewAfter.get(u.id);
      if (review) out.push(review);
    }
  }
  return out;
}

export function getKoreanUnit(unitId: string): KoreanUnitSummary | undefined {
  return getAllKoreanUnits().find((u) => u.id === unitId);
}

/**
 * 액티비티 정의. unit 별로 다른 활동 구성을 가질 수 있음.
 * - `kind`: 어떤 활동 컴포넌트가 렌더되는지
 * - `data`: 활동에 필요한 정적 데이터 (예: 모음 그룹)
 * - `required`: unit 완료 판정에 포함되는지 (false 면 보조 활동)
 */
export type ActivityKind =
  | 'vowel-listen'
  | 'vowel-write'
  | 'consonant-tap'
  | 'consonant-blend-listen'
  | 'coda-blend-listen'
  | 'consonant-write'
  | 'review-listen'
  | 'review-match'
  | 'review-write'
  | 'cvc-pattern-learn'
  | 'cvc-pattern-write'
  | 'alphabet-letter-learn'
  | 'alphabet-letter-write'
  | 'game-connect-dots'
  | 'game-korean-block'
  | 'game-english-block'
  | 'game-word-writing'
  | 'game-line-matching';

export type ActivitySection = 'learn' | 'play'; // 익히기 / 게임하기

/**
 * 복습 카드 한 장 — 되짚는 단원 하나를 대표한다.
 * 🔴 `letter`(화면 글자)와 `sound`(실제 발음)가 다를 수 있다 — 받침 ㅇ 은 '앙' 으로 읽어야 한다.
 */
export interface ReviewCard {
  unitId: string; // 그림·단어를 가져올 학습 단원
  letter: string; // 카드에 크게 (ㄱ · ㅇ · ㅐ)
  syllable: string; // 카드 아래 작게 (가 · 앙 · 애)
  sound: string; // 발음할 텍스트
  /** 이 단원이 글자를 가르치는 자리 — 대표 단어를 고를 때 어디를 보는지 결정한다. */
  matchPosition: 'cho' | 'jung' | 'jong';
}

export interface ActivityDef {
  key: string; // 'listen-1', 'write-2', ...
  order: number; // 1-based 표시 순서
  kind: ActivityKind;
  section: ActivitySection;
  title: string;
  subtitle?: string;
  emoji: string;
  /** 이 액티비티 unit 완료 판정에 포함? 모음 단원은 vowels 4개만 required, 게임은 단어 없으면 optional */
  required: boolean;
  /** vowel-listen/vowel-write 활동용 — 보여줄 모음 + 음절 쌍 */
  vowels?: ReadonlyArray<{ vowel: string; syllable: string }>;
  /** consonant-* 활동용 — 학습 대상 자음 (예: 'ㄱ'). */
  consonant?: string;
  /**
   * consonant-tap / consonant-write 활동용 — 화면 글자와 **다른** 발음을 낼 때.
   * 받침은 홀로 소리 낼 수 없어 글자는 'ㅇ' 이지만 소리는 예시 음절 '앙' 이어야 한다.
   * 미지정이면 `consonant` 를 그대로 읽는다 (한글1 자음 단원은 무변경).
   */
  soundText?: string;
  /** consonant-blend-listen 활동용 — 자음과 결합할 모음 글자만 (예: ['ㅏ','ㅑ','ㅓ','ㅕ','ㅗ','ㅛ']). 한 행씩 표시. */
  blendVowels?: ReadonlyArray<string>;
  /** coda-blend-listen 활동용 — 학습 대상 받침 (예: 'ㅇ'). */
  coda?: string;
  /** coda-blend-listen 활동용 — 받침을 붙일 음절의 초성 (예: ['ㄱ','ㄴ',…] → 가+ㅇ→강). 중성은 ㅏ 고정. */
  codaOnsets?: ReadonlyArray<string>;
  /** review-* 활동용 — 이 복습이 되짚는 글자 카드들. */
  reviewCards?: ReadonlyArray<ReviewCard>;
  /** cvc-pattern-learn (영어) 활동용 — 학습 대상 VC. Phase A 에 vowel + consonant → vc, Phase B 에 flashcards 의 phonicPattern 매치 4 단어. */
  cvcPattern?: { vowel: string; consonant: string; vc: string };
  /** alphabet-letter-learn (영어 Book 1) 활동용 — storybook.phonicsLesson.blending[letterIndex] / wordFamilies[letterIndex] 인덱스. */
  letterIndex?: number;
  /** alphabet-letter-write (영어 Book 1) 활동용 — unit 내 학습 글자 목록 (예: ['A','B','C']). 각 글자마다 대문자/소문자 쓰기 캔버스 노출. */
  letters?: readonly string[];
}

export interface ActivityPlan {
  activities: readonly ActivityDef[];
}

/** 모음 그룹 — 사용자 스펙: act1 = ㅏ ㅑ ㅓ ㅕ ㅗ ㅛ, act2 = ㅜ ㅠ ㅡ ㅣ */
const VOWEL_GROUP_1 = [
  { vowel: 'ㅏ', syllable: '아' },
  { vowel: 'ㅑ', syllable: '야' },
  { vowel: 'ㅓ', syllable: '어' },
  { vowel: 'ㅕ', syllable: '여' },
  { vowel: 'ㅗ', syllable: '오' },
  { vowel: 'ㅛ', syllable: '요' },
] as const;
const VOWEL_GROUP_2 = [
  { vowel: 'ㅜ', syllable: '우' },
  { vowel: 'ㅠ', syllable: '유' },
  { vowel: 'ㅡ', syllable: '으' },
  { vowel: 'ㅣ', syllable: '이' },
] as const;

const UNIT_01_PLAN: ActivityPlan = {
  activities: [
    {
      key: 'listen-1',
      order: 1,
      kind: 'vowel-listen',
      section: 'learn',
      title: '모음 듣기 1',
      subtitle: 'ㅏ ㅑ ㅓ ㅕ ㅗ ㅛ',
      emoji: '👂',
      required: true,
      vowels: VOWEL_GROUP_1,
    },
    {
      key: 'listen-2',
      order: 2,
      kind: 'vowel-listen',
      section: 'learn',
      title: '모음 듣기 2',
      subtitle: 'ㅜ ㅠ ㅡ ㅣ',
      emoji: '👂',
      required: true,
      vowels: VOWEL_GROUP_2,
    },
    {
      key: 'write-1',
      order: 3,
      kind: 'vowel-write',
      section: 'learn',
      title: '모음 쓰기 1',
      subtitle: '아 야 어 여 오 요',
      emoji: '✏️',
      required: true,
      vowels: VOWEL_GROUP_1,
    },
    {
      key: 'write-2',
      order: 4,
      kind: 'vowel-write',
      section: 'learn',
      title: '모음 쓰기 2',
      subtitle: '우 유 으 이',
      emoji: '✏️',
      required: true,
      vowels: VOWEL_GROUP_2,
    },
    {
      key: 'game-dots',
      order: 5,
      kind: 'game-connect-dots',
      section: 'play',
      title: '낱말 그리기',
      emoji: '🔵',
      required: false,
    },
    {
      key: 'game-korean-block',
      order: 6,
      kind: 'game-korean-block',
      section: 'play',
      title: '한글 블록 게임',
      emoji: '🧩',
      required: false,
    },
    {
      key: 'game-word-writing',
      order: 7,
      kind: 'game-word-writing',
      section: 'play',
      title: '낱말 쓰기',
      emoji: '🖍️',
      required: false,
    },
    {
      key: 'game-line-matching',
      order: 8,
      kind: 'game-line-matching',
      section: 'play',
      title: '그림 짝 찾기',
      emoji: '🔗',
      required: false,
    },
  ],
};

// ─── 자음 단원 (ㄱ ~ ㅎ) 공용 plan 생성기 ───
// 모음 그룹 (자음+모음 액티비티용)
const CONSONANT_BLEND_VOWELS_1 = ['ㅏ', 'ㅑ', 'ㅓ', 'ㅕ', 'ㅗ', 'ㅛ'] as const;
const CONSONANT_BLEND_VOWELS_2 = ['ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ', 'ㅣ'] as const;

/**
 * 자음 단원 (ㄱ~ㅎ) 공통 활동 plan 생성. 14 자음 모두 같은 구조 — 자음만 바뀌어 4 learn + 4 game.
 */
function makeConsonantPlan(consonant: string): ActivityPlan {
  return {
    activities: [
      {
        key: 'consonant-tap',
        order: 1,
        kind: 'consonant-tap',
        section: 'learn',
        title: `${consonant} 배우기`,
        emoji: '👆',
        required: true,
        consonant,
      },
      {
        key: 'blend-listen-1',
        order: 2,
        kind: 'consonant-blend-listen',
        section: 'learn',
        // 🔴 같은 제목 두 장이 나란히 놓이면 뭐가 다른지 알 수 없다(모음 묶음이 다르다).
        // 모음 듣기 1/2 · 쓰기 1/2 과 같은 규칙으로 번호를 붙인다.
        title: `${consonant} + 모음 배우기 1`,
        emoji: '🔗',
        required: true,
        consonant,
        blendVowels: [...CONSONANT_BLEND_VOWELS_1],
      },
      {
        key: 'blend-listen-2',
        order: 3,
        kind: 'consonant-blend-listen',
        section: 'learn',
        title: `${consonant} + 모음 배우기 2`,
        emoji: '🔗',
        required: true,
        consonant,
        blendVowels: [...CONSONANT_BLEND_VOWELS_2],
      },
      {
        key: 'consonant-write',
        order: 4,
        kind: 'consonant-write',
        section: 'learn',
        title: `${consonant} 쓰기`,
        emoji: '✏️',
        required: true,
        consonant,
      },
      {
        key: 'game-korean-block',
        order: 5,
        kind: 'game-korean-block',
        section: 'play',
        title: '한글 블록 게임',
        emoji: '🧩',
        required: false,
      },
      {
        key: 'game-word-writing',
        order: 6,
        kind: 'game-word-writing',
        section: 'play',
        title: '낱말 쓰기',
        emoji: '🖍️',
        required: false,
      },
      {
        key: 'game-dots',
        order: 7,
        kind: 'game-connect-dots',
        section: 'play',
        title: '낱말 그리기',
        emoji: '🔵',
        required: false,
      },
      {
        key: 'game-line-matching',
        order: 8,
        kind: 'game-line-matching',
        section: 'play',
        title: '그림 짝 찾기',
        emoji: '🔗',
        required: false,
      },
    ],
  };
}

// 한글1 자음 단원 매핑 — u02 (ㄱ) ~ u15 (ㅎ).
// 같은 자음 모듈 (ConsonantTap / BlendListen / Write + 게임 4) 을 재사용. 자음만 바뀜.
const CONSONANT_UNIT_MAP: Record<string, string> = {
  'kr-h1-u02': 'ㄱ',
  'kr-h1-u03': 'ㄴ',
  'kr-h1-u04': 'ㄷ',
  'kr-h1-u05': 'ㄹ',
  'kr-h1-u06': 'ㅁ',
  'kr-h1-u07': 'ㅂ',
  'kr-h1-u08': 'ㅅ',
  'kr-h1-u09': 'ㅇ',
  'kr-h1-u10': 'ㅈ',
  'kr-h1-u11': 'ㅊ',
  'kr-h1-u12': 'ㅋ',
  'kr-h1-u13': 'ㅌ',
  'kr-h1-u14': 'ㅍ',
  'kr-h1-u15': 'ㅎ',
};

// ─── 게임 4종 (모든 단원 공통 꼬리) ───
const GAME_ACTIVITIES: ReadonlyArray<Omit<ActivityDef, 'order'>> = [
  {
    key: 'game-korean-block',
    kind: 'game-korean-block',
    section: 'play',
    title: '한글 블록 게임',
    emoji: '🧩',
    required: false,
  },
  {
    key: 'game-word-writing',
    kind: 'game-word-writing',
    section: 'play',
    title: '낱말 쓰기',
    emoji: '🖍️',
    required: false,
  },
  {
    key: 'game-dots',
    kind: 'game-connect-dots',
    section: 'play',
    title: '낱말 그리기',
    emoji: '🔵',
    required: false,
  },
  {
    key: 'game-line-matching',
    kind: 'game-line-matching',
    section: 'play',
    title: '그림 짝 찾기',
    emoji: '🔗',
    required: false,
  },
];

function withGames(learn: ReadonlyArray<Omit<ActivityDef, 'order'>>): ActivityPlan {
  return {
    activities: [...learn, ...GAME_ACTIVITIES].map((a, i) => ({ ...a, order: i + 1 })),
  };
}

// ─── 한글2 받침 단원 (ㅇㄱㄴㄹㅅㅁㅂ) ───
// 받침을 붙일 음절의 초성 14개. 커리큘럼 blending 과 같은 순서로 7+7 두 장.
const CODA_ONSETS_1 = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ'] as const;
const CODA_ONSETS_2 = ['ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'] as const;

/**
 * 받침 단원 활동 plan. 자음 단원과 같은 4 learn + 4 game 리듬.
 * 🔴 받침은 홀로 소리 낼 수 없어 배우기·쓰기의 **발음은 예시 음절**(ㅇ → '앙') 이다.
 */
function makeCodaPlan(coda: string): ActivityPlan {
  const sample = composeHangul('ㅇ', 'ㅏ', coda) || `아${coda}`; // 앙·악·안·알·앗·암·압
  return withGames([
    {
      key: 'consonant-tap',
      kind: 'consonant-tap',
      section: 'learn',
      title: `${coda} 받침 배우기`,
      emoji: '👆',
      required: true,
      consonant: coda,
      soundText: sample,
    },
    {
      key: 'coda-listen-1',
      kind: 'coda-blend-listen',
      section: 'learn',
      title: `${coda} 받침 붙이기 1`,
      emoji: '🔗',
      required: true,
      coda,
      codaOnsets: [...CODA_ONSETS_1],
    },
    {
      key: 'coda-listen-2',
      kind: 'coda-blend-listen',
      section: 'learn',
      title: `${coda} 받침 붙이기 2`,
      emoji: '🔗',
      required: true,
      coda,
      codaOnsets: [...CODA_ONSETS_2],
    },
    {
      key: 'consonant-write',
      kind: 'consonant-write',
      section: 'learn',
      title: `${coda} 받침 쓰기`,
      emoji: '✏️',
      required: true,
      consonant: coda,
      soundText: sample,
    },
  ]);
}

// ─── 한글4 복잡한 모음 단원 (ㅐㅔ · ㅖㅚ · ㅟㅢ · ㅘㅙ · ㅝㅞㅢ) ───
/**
 * 복잡한 모음 단원 plan. 모음이 2~3개뿐이라 u01 처럼 1/2 로 쪼개지 않고 듣기 1 + 쓰기 1.
 * 음절은 `composeHangul('ㅇ', v)` 로 파생 — ㅐ→애, ㅚ→외 (하드코딩 없음).
 */
function makeComplexVowelPlan(vowels: readonly string[]): ActivityPlan {
  const pairs = vowels.map((v) => ({
    vowel: v,
    syllable: composeHangul('ㅇ', v, null) || v,
  }));
  return withGames([
    {
      key: 'listen-1',
      kind: 'vowel-listen',
      section: 'learn',
      title: '모음 듣기',
      emoji: '👂',
      required: true,
      vowels: pairs,
    },
    {
      key: 'write-1',
      kind: 'vowel-write',
      section: 'learn',
      title: '모음 쓰기',
      emoji: '✏️',
      required: true,
      vowels: pairs,
    },
  ]);
}

// ─── 복습 단원 ───
/**
 * 되짚는 학습 단원 하나 → 복습 카드 한 장.
 * 🔴 레벨마다 글자와 소리의 관계가 다르다 — 받침만 letter ≠ sound.
 */
function toReviewCard(u: KoreanUnitSummary): ReviewCard | null {
  const first = u.phonemes[0];
  if (!first) return null;
  if (u.levelIndex === 2) {
    const coda = first.replace('받침', '');
    const syllable = composeHangul('ㅇ', 'ㅏ', coda) || `아${coda}`;
    return { unitId: u.id, letter: coda, syllable, sound: syllable, matchPosition: 'jong' };
  }
  if (u.levelIndex === 4) {
    const syllable = composeHangul('ㅇ', first, null) || first;
    return { unitId: u.id, letter: first, syllable, sound: first, matchPosition: 'jung' };
  }
  // 자음·쌍자음 — 대표 음절은 ㅏ 결합
  const syllable = composeHangul(first, 'ㅏ', null) || first;
  return { unitId: u.id, letter: first, syllable, sound: first, matchPosition: 'cho' };
}

/**
 * 복습 단원 활동 plan — 5~7세용 3종. 게임을 따로 붙이지 않는다(복습 자체가 놀이 형식이다).
 *
 * ① 다시 듣기 — 배운 글자를 순서대로 듣고 → 듣고 맞추기 퀴즈 (학습 단원의 모음 듣기와 같은 컴포넌트)
 * ② 짝 찾기 — 글자 ↔ 그 글자로 배운 단어 그림
 * ③ 글자 쓰기 — 그림을 보고 첫 글자 쓰기
 */
function makeReviewPlan(cards: readonly ReviewCard[]): ActivityPlan {
  const shared = { required: true, reviewCards: cards } as const;
  return {
    activities: [
      {
        key: 'review-listen',
        order: 1,
        kind: 'review-listen',
        section: 'learn',
        title: '다시 듣기',
        emoji: '👂',
        ...shared,
      },
      {
        key: 'review-match',
        order: 2,
        kind: 'review-match',
        section: 'play',
        title: '짝 찾기',
        emoji: '🔗',
        ...shared,
      },
      {
        key: 'review-write',
        order: 3,
        kind: 'review-write',
        section: 'play',
        title: '글자 쓰기',
        emoji: '✏️',
        ...shared,
      },
    ],
  };
}

/**
 * 커리큘럼에서 파생하는 단원 plan — 한글2(받침)·3(쌍자음)·4(복잡한 모음).
 * 🔴 유닛 목록을 여기에 다시 적지 않는다. 커리큘럼에 단원이 늘면 자동으로 활동이 생긴다.
 */
function derivedPlans(): Record<string, ActivityPlan> {
  const out: Record<string, ActivityPlan> = {};
  const byId = new Map(getCurriculumUnits().map((u) => [u.id, u]));
  for (const u of getAllKoreanUnits()) {
    if (u.isReview) {
      const cards = (u.coveredUnitIds ?? [])
        .map((id) => byId.get(id))
        .flatMap((c) => (c ? [toReviewCard(c)] : []))
        .filter((c): c is ReviewCard => !!c)
        .slice(0, MAX_REVIEW_CARDS);
      if (cards.length) out[u.id] = makeReviewPlan(cards);
      continue;
    }
    const first = u.phonemes[0];
    if (!first) continue;
    if (u.levelIndex === 2) {
      out[u.id] = makeCodaPlan(first.replace('받침', '')); // '받침ㅇ' → 'ㅇ'
    } else if (u.levelIndex === 3) {
      out[u.id] = makeConsonantPlan(first); // 쌍자음 — 데이터 모양이 한글1 자음과 동일
    } else if (u.levelIndex === 4) {
      out[u.id] = makeComplexVowelPlan(u.phonemes);
    }
  }
  return out;
}

/** unit ID → 활동 구성. 미정의 unit 은 빈 활동 (잠금 표시). */
export const KOREAN_UNIT_ACTIVITY_PLAN: Record<string, ActivityPlan> = {
  'kr-h1-u01': UNIT_01_PLAN,
  ...Object.fromEntries(
    Object.entries(CONSONANT_UNIT_MAP).map(([unitId, c]) => [unitId, makeConsonantPlan(c)])
  ),
  ...derivedPlans(),
};

export function getActivityPlan(unitId: string): ActivityPlan {
  return KOREAN_UNIT_ACTIVITY_PLAN[unitId] ?? { activities: [] };
}

/** unit 완료 판정에 쓰이는 required 액티비티 key 들. */
export function getRequiredActivities(unitId: string): readonly string[] {
  return getActivityPlan(unitId)
    .activities.filter((a) => a.required)
    .map((a) => a.key);
}

/** 다음 액티비티 unlock 판정 — 이전 액티비티 완료 시 unlock. 첫 번째는 항상 unlock. */
export function isActivityUnlocked(
  unitId: string,
  activityKey: string,
  completedKeys: readonly string[]
): boolean {
  const plan = getActivityPlan(unitId);
  const idx = plan.activities.findIndex((a) => a.key === activityKey);
  if (idx <= 0) return idx === 0; // 첫 번째 또는 not found
  const prev = plan.activities[idx - 1];
  return completedKeys.includes(prev.key);
}

/**
 * 다음 unit unlock 판정 — 이전 unit 의 required 모두 완료 시.
 * 첫 unit (단원 목록의 첫 번째) 은 항상 unlock.
 */
export function isUnitUnlocked(
  unitId: string,
  isUnitDone: (uid: string, required: readonly string[]) => boolean
): boolean {
  const units = getAllKoreanUnits();
  const idx = units.findIndex((u) => u.id === unitId);
  if (idx <= 0) return idx === 0;
  const prev = units[idx - 1];
  return isUnitDone(prev.id, getRequiredActivities(prev.id));
}
