/**
 * 중국어 병음(拼音) 파닉스 학습자 메타 — 한/영 평행 구조.
 *
 * 🔴 **MVP = Level 1**(성조 + 단운모, 3유닛 — 교안 순서). 소리 유닛이라 삽화가 없다 — 활동은 전부
 *    기존 컴포넌트 재사용이다(새 컴포넌트 0):
 *      · 성조 유닛(u01): 듣고 배우기(a 4성 ā á ǎ à) → 성조 듣고 고르기(`word-listen-choose`, 성조 부호 보기)
 *      · 단운모 유닛(u02 a o e · u03 i u ü): 듣고 배우기(각 모음 4성 순서) → 따라쓰기(`vowel-write`) → 글자 사냥(`letter-hunt`)
 *
 * 🔴 **음원 = 원어민 녹음 직행**(`mod_chinese`). 카드의 `sound`(단일)·`sounds`(4성 시퀀스)가 곧 R2 조회 키다:
 *    단운모 배우기는 모음의 **4성을 순서로**(운모 놀이판) 들려주고, 쓰기·사냥은 tone-1 글자, 성조 유닛은 a 4성.
 *    호스트가 `getChineseSyllableUrl(sound)` 로 URL 을 미리 뽑아 활동에 `ttsUrl` 로 넘긴다.
 *    L2~L5(성모 블렌딩·게임)는 후속.
 */
import { CHINESE_PHONICS_CURRICULUM } from '@tangobook/shared';
import type { ActivityPlan } from './korean-phonics-units';

export interface ChineseUnitSummary {
  id: string; // 'zh-l1-u01'
  levelKey: string; // 'level1'
  levelName: string; // 'Level 1: 단운모 + 성조'
  levelIndex: number; // 1
  unitIndexInLevel: number;
  unitTitle: string; // 'Unit 01: a o e'
  phonemes: string[];
  patterns: string[];
  targetWords: string[];
}

/** 화면에 깔리는 병음 카드 한 장 — `label`=보이는 병음, `sound`=발음(mp3) 조회 키. */
export interface PinyinCard {
  label: string;
  sound: string;
  /**
   * 「배우기」에서 이 카드를 누르면 **순서로** 들려줄 소리들(단운모 4성 ā á ǎ à). 없으면 `sound` 하나만.
   * 🔴 교안 운모 놀이판 = 그 운모의 4성을 순서로 들려줌(성조 비교). `sound` 는 tone-1(warm·라벨용).
   */
  sounds?: string[];
}

/** 단운모 → tone-1(고평조) 부호 — 소릿결을 들려주는 「배우기」의 발음 키. */
const TONE1: Record<string, string> = { a: 'ā', o: 'ō', e: 'ē', i: 'ī', u: 'ū', ü: 'ǖ' };

/** 단운모별 4성 부호 — 「성조 듣고 고르기」의 보기 라벨(소리는 음절, 보기는 성조 부호). */
const TONE_MARKS: Record<string, string[]> = {
  a: ['ā', 'á', 'ǎ', 'à'],
  o: ['ō', 'ó', 'ǒ', 'ò'],
  e: ['ē', 'é', 'ě', 'è'],
  i: ['ī', 'í', 'ǐ', 'ì'],
  u: ['ū', 'ú', 'ǔ', 'ù'],
  ü: ['ǖ', 'ǘ', 'ǚ', 'ǜ'],
}; // ponytail: L1 성조 유닛(ma)만 씀 — 필요할 때 성모 유닛에서 재사용

export function getAllChineseUnits(): ChineseUnitSummary[] {
  const out: ChineseUnitSummary[] = [];
  for (const level of CHINESE_PHONICS_CURRICULUM) {
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
        patterns: [...(u.patterns ?? [])],
        targetWords: [...(u.sampleWords ?? [])],
      });
    }
  }
  return out;
}

export function getChineseUnit(unitId: string): ChineseUnitSummary | undefined {
  return getAllChineseUnits().find((u) => u.id === unitId);
}

/** 성조 유닛인가 — 같은 「듣고 고르기」 컴포넌트지만 카드가 4성이고 흐름(성조 고르기)이 하나 더 붙는다. */
export function isToneUnit(unitId: string): boolean {
  return getChineseUnit(unitId)?.patterns.includes('tones') ?? false;
}

/**
 * 성모(声母) 유닛인가 — 카드 = 성모 글자(phonemes), 소리 = 결합 citation 음절(sampleWords, 낱 소리 하나).
 * 🔴 단운모처럼 4성 시퀀스를 붙이지 않는다 — 성모는 한 소리(bō)로만 들려준다.
 */
export function isInitialUnit(unitId: string): boolean {
  return getChineseUnit(unitId)?.patterns.includes('initial') ?? false;
}

/** 성모 유닛 카드 — label=성모 글자, sound=결합 음절(bō). 배우기·쓰기·사냥이 같은 모양을 쓴다. */
function initialCards(u: ChineseUnitSummary): PinyinCard[] {
  return u.phonemes.map((p, i) => ({ label: p, sound: u.targetWords[i] ?? p }));
}

/**
 * 「듣고 배우기」 카드. 단운모 유닛은 낱 모음(a·o·e, 소리=tone-1 ā·ō·ē), 성조 유닛은 4성 음절(mā·má·mǎ·mà).
 */
export function getChineseUnitCards(unitId: string): PinyinCard[] {
  const u = getChineseUnit(unitId);
  if (!u) return [];
  if (isToneUnit(unitId)) {
    // 성조 유닛 — sampleWords 가 곧 4성 음절이고 라벨·소리가 같다.
    return u.targetWords.map((w) => ({ label: w, sound: w }));
  }
  if (isInitialUnit(unitId)) return initialCards(u);
  // 단운모 — 보이는 건 낱 모음, 소리는 tone-1(소릿결).
  return u.phonemes.map((p) => ({ label: p, sound: TONE1[p] ?? p }));
}

/**
 * 「배우기」(듣고 배우기) 카드 — write/hunt(`getChineseUnitCards`)와 **갈린다**.
 *
 * 🔴 성조 유닛(u01) = 4성 카드(ā á ǎ à, label=sound). 🔴 단운모 유닛(u02·u03) = 낱 모음 카드지만
 *    누르면 **그 모음의 4성을 순서로**(`sounds`) 들려준다 — 운모 놀이판(성조 비교). 쓰기·사냥은
 *    낱 모음 글자 하나가 목표라 `getChineseUnitCards`(4성 안 붙음)를 그대로 쓴다.
 */
export function getChineseListenCards(unitId: string): PinyinCard[] {
  const u = getChineseUnit(unitId);
  if (!u) return [];
  if (isToneUnit(unitId)) {
    return u.targetWords.map((w) => ({ label: w, sound: w }));
  }
  // 성모 = 낱 소리 하나(bō). 4성 시퀀스는 단운모(운모 놀이판)에서만.
  if (isInitialUnit(unitId)) return initialCards(u);
  return u.phonemes.map((p) => {
    const marks = TONE_MARKS[p];
    return {
      label: p,
      sound: marks?.[0] ?? TONE1[p] ?? p, // tone-1 — warm·라벨·폴백용
      ...(marks ? { sounds: marks } : {}),
    };
  });
}

/**
 * 「성조 듣고 고르기」 카드(성조 유닛 전용) — 소리는 음절 4성(u01 은 ā á ǎ à), 보기는 **성조 부호**.
 * 들은 성조를 부호에 짝지어 "성조가 뜻을 가른다"를 익힌다.
 */
export function getChineseToneChoiceCards(unitId: string): PinyinCard[] {
  const u = getChineseUnit(unitId);
  if (!u || !isToneUnit(unitId)) return [];
  const nucleus = [...(u.phonemes[0] ?? '')].find((ch) => TONE_MARKS[ch]) ?? 'a';
  const marks = TONE_MARKS[nucleus] ?? TONE_MARKS.a;
  return u.targetWords.map((w, i) => ({ label: marks[i] ?? w, sound: w }));
}

// ── 활동 plan ─────────────────────────────────────────────────────────────────
// 🔴 plan 에 없으면 라우트로 도달해도 죽은 코드다(한/영 반복 함정). 유닛 종류로 갈린다.
const LISTEN_FIRST = {
  key: 'listen-choose',
  order: 1,
  kind: 'word-listen-choose',
  section: 'learn',
  title: '듣고 배우기',
  emoji: '🔊',
  required: true,
} as const;

function makeSingleFinalPlan(): ActivityPlan {
  return {
    activities: [
      LISTEN_FIRST,
      {
        key: 'write',
        order: 2,
        kind: 'vowel-write',
        section: 'learn',
        title: '따라쓰기',
        emoji: '✏️',
        required: true,
      },
      {
        key: 'hunt',
        order: 3,
        kind: 'letter-hunt',
        section: 'learn',
        title: '글자 사냥',
        emoji: '🔎',
        required: false,
      },
    ],
  };
}

const HUNT = {
  key: 'hunt',
  order: 3,
  kind: 'letter-hunt',
  section: 'learn',
  title: '글자 사냥',
  emoji: '🔎',
  required: false,
} as const;

/**
 * 따라쓰기를 뺀 성모 plan(zh/ch/sh 처럼 2글자 성모) — 배우기 + 글자 사냥.
 * `LetterFillCanvas` 는 한 글자 캔버스라 2글자 성모를 못 쓴다(배우기·사냥은 글자 수와 무관).
 */
function makeNoWritePlan(): ActivityPlan {
  return { activities: [LISTEN_FIRST, { ...HUNT, order: 2 }] };
}

function makeTonePlan(): ActivityPlan {
  return {
    activities: [
      LISTEN_FIRST,
      {
        key: 'tone-choose',
        order: 2,
        kind: 'word-listen-choose',
        section: 'learn',
        title: '성조 듣고 고르기',
        emoji: '🎵',
        required: true,
      },
    ],
  };
}

/**
 * 유닛 → plan. 성조 유닛 = 배우기 + 성조 고르기 / 그 외(단운모·성모) = 배우기 + 따라쓰기 + 사냥.
 * 🔴 성모에 2글자(zh/ch/sh)가 섞이면 따라쓰기를 빼고 배우기·사냥만 둔다(위 `makeNoWritePlan`).
 */
function planForUnit(u: ChineseUnitSummary): ActivityPlan {
  if (u.patterns.includes('tones')) return makeTonePlan();
  if (u.phonemes.some((p) => p.length > 1)) return makeNoWritePlan();
  return makeSingleFinalPlan();
}

export const CHINESE_UNIT_ACTIVITY_PLAN: Record<string, ActivityPlan> = Object.fromEntries(
  getAllChineseUnits().map((u) => [u.id, planForUnit(u)])
);

export function getChineseActivityPlan(unitId: string): ActivityPlan {
  return CHINESE_UNIT_ACTIVITY_PLAN[unitId] ?? { activities: [] };
}

export function getChineseRequiredActivities(unitId: string): readonly string[] {
  return getChineseActivityPlan(unitId)
    .activities.filter((a) => a.required)
    .map((a) => a.key);
}
