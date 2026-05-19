/**
 * 한글 파닉스 학습자 메타 — 사이드 진입용 unit 목록 + unit 1 활동 구성.
 *
 * 데이터 source: 저작도구의 `KOREAN_PHONICS_CURRICULUM` (`@tangobook/shared`).
 * R2 storybook ID 는 `kr-hN-uMM` 형식 (zero-pad).
 *
 * 활동 구성은 unit 마다 다를 수 있어 `KOREAN_UNIT_ACTIVITY_PLAN` 으로 분리.
 * unit 1 (모음) 만 작성 — 나머지는 자료 모이는 대로 추가.
 */
import { KOREAN_PHONICS_CURRICULUM } from '@tangobook/shared';

export interface KoreanUnitSummary {
  id: string; // 'kr-h1-u01'
  levelKey: string; // 'hangul1'
  levelName: string; // '한글1: 기본음절'
  levelIndex: number; // 1
  unitIndexInLevel: number; // 1 (1-based)
  unitTitle: string; // 'unit 01: 모음 배우기'
  phonemes: string[];
  targetWords: string[];
}

/** 모든 한글 unit 을 평탄화 + 학습 순서대로. */
export function getAllKoreanUnits(): KoreanUnitSummary[] {
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
  | 'consonant-write'
  | 'game-connect-dots'
  | 'game-korean-block'
  | 'game-word-writing'
  | 'game-line-matching';

export type ActivitySection = 'learn' | 'play'; // 익히기 / 게임하기

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
  /** consonant-blend-listen 활동용 — 자음과 결합할 모음 글자만 (예: ['ㅏ','ㅑ','ㅓ','ㅕ','ㅗ','ㅛ']). 한 행씩 표시. */
  blendVowels?: ReadonlyArray<string>;
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
      title: '점 잇기',
      subtitle: '단어 그림 그려보기',
      emoji: '🔵',
      required: false,
    },
    {
      key: 'game-korean-block',
      order: 6,
      kind: 'game-korean-block',
      section: 'play',
      title: '한글 블록',
      subtitle: '자모 맞추기',
      emoji: '🧩',
      required: false,
    },
    {
      key: 'game-word-writing',
      order: 7,
      kind: 'game-word-writing',
      section: 'play',
      title: '낱말 쓰기',
      subtitle: '글자 따라쓰기',
      emoji: '🖍️',
      required: false,
    },
    {
      key: 'game-line-matching',
      order: 8,
      kind: 'game-line-matching',
      section: 'play',
      title: '그림 짝 찾기',
      subtitle: '그림-단어 잇기',
      emoji: '🔗',
      required: false,
    },
  ],
};

// ─── unit 2 (ㄱ 배우기) ───
const UNIT_02_PLAN: ActivityPlan = {
  activities: [
    {
      key: 'consonant-tap',
      order: 1,
      kind: 'consonant-tap',
      section: 'learn',
      title: 'ㄱ 누르기',
      subtitle: 'ㄱ ㄱ 단어',
      emoji: '👆',
      required: true,
      consonant: 'ㄱ',
    },
    {
      key: 'blend-listen-1',
      order: 2,
      kind: 'consonant-blend-listen',
      section: 'learn',
      title: 'ㄱ + 모음 1',
      subtitle: '가 갸 거 겨 고 교',
      emoji: '🔗',
      required: true,
      consonant: 'ㄱ',
      blendVowels: ['ㅏ', 'ㅑ', 'ㅓ', 'ㅕ', 'ㅗ', 'ㅛ'],
    },
    {
      key: 'blend-listen-2',
      order: 3,
      kind: 'consonant-blend-listen',
      section: 'learn',
      title: 'ㄱ + 모음 2',
      subtitle: '고 교 구 규 그 기',
      emoji: '🔗',
      required: true,
      consonant: 'ㄱ',
      blendVowels: ['ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ', 'ㅣ'],
    },
    {
      key: 'consonant-write',
      order: 4,
      kind: 'consonant-write',
      section: 'learn',
      title: 'ㄱ 쓰기',
      subtitle: '단어와 함께 써봐요',
      emoji: '✏️',
      required: true,
      consonant: 'ㄱ',
    },
    {
      key: 'game-korean-block',
      order: 5,
      kind: 'game-korean-block',
      section: 'play',
      title: '한글 블록',
      subtitle: '자모 맞추기',
      emoji: '🧩',
      required: false,
    },
    {
      key: 'game-word-writing',
      order: 6,
      kind: 'game-word-writing',
      section: 'play',
      title: '낱말 쓰기',
      subtitle: '글자 따라쓰기',
      emoji: '🖍️',
      required: false,
    },
    {
      key: 'game-dots',
      order: 7,
      kind: 'game-connect-dots',
      section: 'play',
      title: '점 잇기',
      subtitle: '단어 그림 그려보기',
      emoji: '🔵',
      required: false,
    },
    {
      key: 'game-line-matching',
      order: 8,
      kind: 'game-line-matching',
      section: 'play',
      title: '그림 짝 찾기',
      subtitle: '그림-단어 잇기',
      emoji: '🔗',
      required: false,
    },
  ],
};

/** unit ID → 활동 구성. 미정의 unit 은 빈 활동 (잠금 표시). */
export const KOREAN_UNIT_ACTIVITY_PLAN: Record<string, ActivityPlan> = {
  'kr-h1-u01': UNIT_01_PLAN,
  'kr-h1-u02': UNIT_02_PLAN,
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
