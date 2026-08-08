/**
 * 중국어 병음(拼音) 파닉스 학습자 메타 — 한/영 평행 구조.
 *
 * 🔴 **MVP = Level 1**(단운모 6 + 성조 3유닛). 소리 유닛이라 삽화가 없다 — 활동은 전부 기존 컴포넌트
 *    재사용이다(새 컴포넌트 0):
 *      · 단운모 유닛(u01·u02): 듣고 배우기(`word-listen-choose`) → 따라쓰기(`vowel-write`) → 글자 사냥(`letter-hunt`)
 *      · 성조 유닛(u03): 듣고 배우기(4성) → 성조 듣고 고르기(`word-listen-choose`, 성조 부호 보기)
 *
 * 🔴 **음원 = 원어민 녹음 직행**(`mod_chinese`). 카드의 `sound` 가 곧 R2 조회 키다:
 *    단운모는 **tone-1**(a→ā) 로 소릿결을 들려주고, 성조 유닛은 음절 4성(mā·má·mǎ·mà)을 들려준다.
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
 * 「듣고 배우기」 카드. 단운모 유닛은 낱 모음(a·o·e, 소리=tone-1 ā·ō·ē), 성조 유닛은 4성 음절(mā·má·mǎ·mà).
 */
export function getChineseUnitCards(unitId: string): PinyinCard[] {
  const u = getChineseUnit(unitId);
  if (!u) return [];
  if (isToneUnit(unitId)) {
    // 성조 유닛 — sampleWords 가 곧 4성 음절이고 라벨·소리가 같다.
    return u.targetWords.map((w) => ({ label: w, sound: w }));
  }
  // 단운모 — 보이는 건 낱 모음, 소리는 tone-1(소릿결).
  return u.phonemes.map((p) => ({ label: p, sound: TONE1[p] ?? p }));
}

/**
 * 「성조 듣고 고르기」 카드(성조 유닛 전용) — 소리는 음절 4성(mā…), 보기는 **성조 부호**(ā á ǎ à).
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

export const CHINESE_UNIT_ACTIVITY_PLAN: Record<string, ActivityPlan> = Object.fromEntries(
  getAllChineseUnits().map((u) => [
    u.id,
    u.patterns.includes('tones') ? makeTonePlan() : makeSingleFinalPlan(),
  ])
);

export function getChineseActivityPlan(unitId: string): ActivityPlan {
  return CHINESE_UNIT_ACTIVITY_PLAN[unitId] ?? { activities: [] };
}

export function getChineseRequiredActivities(unitId: string): readonly string[] {
  return getChineseActivityPlan(unitId)
    .activities.filter((a) => a.required)
    .map((a) => a.key);
}
