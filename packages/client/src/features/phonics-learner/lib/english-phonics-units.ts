/**
 * 영어 파닉스 학습자 메타 — 한글의 평행 구조.
 *
 * 데이터 source: `ENGLISH_PHONICS_CURRICULUM` (`@tangobook/shared`).
 * R2 storybook ID 는 `en-bN-uMM` 형식 (zero-pad).
 *
 * 활동 plan 은 아직 미구성 — 모든 unit 이 "활동 준비 중" 표시.
 * 추후 한글의 `KOREAN_UNIT_ACTIVITY_PLAN` 처럼 `ENGLISH_UNIT_ACTIVITY_PLAN[unitId]` 으로 활동 정의 추가.
 */
import { ENGLISH_PHONICS_CURRICULUM } from '@tangobook/shared';
import type { ActivityPlan } from './korean-phonics-units';

export interface EnglishUnitSummary {
  id: string; // 'en-b1-u01'
  levelKey: string; // 'book1'
  levelName: string; // 'Book 1: Single Letter Sounds'
  levelIndex: number; // 1
  unitIndexInLevel: number;
  unitTitle: string; // 'Unit 01: Aa Bb Cc'
  phonemes: string[];
  targetWords: string[];
}

export function getAllEnglishUnits(): EnglishUnitSummary[] {
  const out: EnglishUnitSummary[] = [];
  for (const level of ENGLISH_PHONICS_CURRICULUM) {
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

export function getEnglishUnit(unitId: string): EnglishUnitSummary | undefined {
  return getAllEnglishUnits().find((u) => u.id === unitId);
}

// ─── Book 2 CVC plan generator ───
// 한 unit 의 VC 패턴들 → 활동 plan (각 패턴 learn + write 2개 + 게임 4종)
interface VcPattern {
  vowel: string;
  consonant: string;
  vc: string;
}

function makeBook2UnitPlan(patterns: readonly VcPattern[]): ActivityPlan {
  const activities: import('./korean-phonics-units').ActivityDef[] = [];
  let order = 1;
  for (const p of patterns) {
    // 1 활동 / VC — CvcPatternLearn 안에 Phase A (배우기) + B (단어) + C (써보기) 통합.
    activities.push({
      key: `cvc-${p.vc}`,
      order: order++,
      kind: 'cvc-pattern-learn',
      section: 'learn',
      title: `${p.vc} 배우기`,
      emoji: '🔤',
      required: true,
      cvcPattern: { ...p },
    });
  }
  // 4 games — 패턴 단어 풀에서 랜덤 4개
  activities.push(
    {
      key: 'game-english-block',
      order: order++,
      kind: 'game-english-block',
      section: 'play',
      title: '영어 블록 게임',
      emoji: '🧩',
      required: false,
    },
    {
      key: 'game-word-writing',
      order: order++,
      kind: 'game-word-writing',
      section: 'play',
      title: '낱말 쓰기',
      emoji: '🖍️',
      required: false,
    },
    {
      key: 'game-dots',
      order: order++,
      kind: 'game-connect-dots',
      section: 'play',
      title: '낱말 그리기',
      emoji: '🔵',
      required: false,
    },
    {
      key: 'game-line-matching',
      order: order,
      kind: 'game-line-matching',
      section: 'play',
      title: '그림 짝 찾기',
      emoji: '🔗',
      required: false,
    }
  );
  return { activities };
}

// ─── Book 1 plan generator (Single Letter Sounds — A·B·C 한 글자씩) ───
// blending[i] = { vowel: 'A', consonant: 'a', blend: 'Aa', exampleWord: 'apple', illustrationUrl, ... }
// wordFamilies[i].words[].hotspots 로 핫스팟 음원 재생.

function makeBook1UnitPlan(letters: readonly string[]): ActivityPlan {
  const activities: import('./korean-phonics-units').ActivityDef[] = [];
  let order = 1;
  // 알파벳 배우기 — unit 내 모든 글자를 한 활동에서 상단 탭으로 전환.
  // 써보기는 별도 카드 X — 학습 페이지 안 "✏️ Aa 써보기" 버튼 → 모달로 통합.
  // title 예: "ABC 배우기" / "STUV 배우기" — 대문자만 명시적으로.
  const letterListLabel = letters.map((L) => L.toUpperCase()).join('');
  activities.push({
    key: 'letters-learn',
    order: order++,
    kind: 'alphabet-letter-learn',
    section: 'learn',
    title: `${letterListLabel} 배우기`,
    emoji: '🔤',
    required: true,
    letters,
  });
  // 4 games — wordFamilies 안 모든 단어 풀에서 어댑터가 픽업
  activities.push(
    {
      key: 'game-english-block',
      order: order++,
      kind: 'game-english-block',
      section: 'play',
      title: '영어 블록 게임',
      emoji: '🧩',
      required: false,
    },
    {
      key: 'game-word-writing',
      order: order++,
      kind: 'game-word-writing',
      section: 'play',
      title: '낱말 쓰기',
      emoji: '🖍️',
      required: false,
    },
    {
      key: 'game-dots',
      order: order++,
      kind: 'game-connect-dots',
      section: 'play',
      title: '낱말 그리기',
      emoji: '🔵',
      required: false,
    },
    {
      key: 'game-line-matching',
      order: order,
      kind: 'game-line-matching',
      section: 'play',
      title: '그림 짝 찾기',
      emoji: '🔗',
      required: false,
    }
  );
  return { activities };
}

// Book 1 unit → 글자 (storybook title 과 일치)
const BOOK1_LETTERS: Record<string, readonly string[]> = {
  'en-b1-u01': ['A', 'B', 'C'],
  'en-b1-u02': ['D', 'E', 'F'],
  'en-b1-u03': ['G', 'H', 'I'],
  'en-b1-u04': ['J', 'K', 'L'],
  'en-b1-u05': ['M', 'N', 'O'],
  'en-b1-u06': ['P', 'Q', 'R'],
  'en-b1-u07': ['S', 'T', 'U', 'V'],
  'en-b1-u08': ['W', 'X', 'Y', 'Z'],
};

// Book 2 (Short Vowels) 8 unit — R2 phonicsConfig.targetPatterns 와 매칭. 단어 자동 추출 (flashcards.phonicPattern).
const BOOK2_PATTERNS: Record<string, readonly VcPattern[]> = {
  'en-b2-u01': [
    { vowel: 'a', consonant: 'n', vc: 'an' },
    { vowel: 'a', consonant: 't', vc: 'at' },
  ],
  'en-b2-u02': [
    { vowel: 'a', consonant: 'p', vc: 'ap' },
    { vowel: 'a', consonant: 'd', vc: 'ad' },
    { vowel: 'a', consonant: 'm', vc: 'am' },
  ],
  'en-b2-u03': [
    { vowel: 'i', consonant: 'p', vc: 'ip' },
    { vowel: 'i', consonant: 't', vc: 'it' },
    { vowel: 'i', consonant: 'x', vc: 'ix' },
  ],
  'en-b2-u04': [
    { vowel: 'i', consonant: 'b', vc: 'ib' },
    { vowel: 'i', consonant: 'd', vc: 'id' },
    { vowel: 'i', consonant: 'g', vc: 'ig' },
    { vowel: 'i', consonant: 'n', vc: 'in' },
  ],
  'en-b2-u05': [
    { vowel: 'e', consonant: 't', vc: 'et' },
    { vowel: 'e', consonant: 'd', vc: 'ed' },
    { vowel: 'e', consonant: 'n', vc: 'en' },
  ],
  'en-b2-u06': [
    { vowel: 'o', consonant: 'g', vc: 'og' },
    { vowel: 'o', consonant: 'p', vc: 'op' },
    { vowel: 'o', consonant: 't', vc: 'ot' },
    { vowel: 'o', consonant: 'x', vc: 'ox' },
  ],
  'en-b2-u07': [
    { vowel: 'u', consonant: 'g', vc: 'ug' },
    { vowel: 'u', consonant: 'b', vc: 'ub' },
    { vowel: 'u', consonant: 'p', vc: 'up' },
  ],
  'en-b2-u08': [
    { vowel: 'u', consonant: 'n', vc: 'un' },
    { vowel: 'u', consonant: 'd', vc: 'ud' },
    { vowel: 'u', consonant: 't', vc: 'ut' },
  ],
};

export const ENGLISH_UNIT_ACTIVITY_PLAN: Record<string, ActivityPlan> = {
  ...Object.fromEntries(
    Object.entries(BOOK1_LETTERS).map(([unitId, letters]) => [unitId, makeBook1UnitPlan(letters)])
  ),
  ...Object.fromEntries(
    Object.entries(BOOK2_PATTERNS).map(([unitId, patterns]) => [
      unitId,
      makeBook2UnitPlan(patterns),
    ])
  ),
};

export function getEnglishActivityPlan(unitId: string): ActivityPlan {
  return ENGLISH_UNIT_ACTIVITY_PLAN[unitId] ?? { activities: [] };
}

export function getEnglishRequiredActivities(unitId: string): readonly string[] {
  return getEnglishActivityPlan(unitId)
    .activities.filter((a) => a.required)
    .map((a) => a.key);
}
