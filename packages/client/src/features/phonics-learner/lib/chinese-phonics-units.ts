/**
 * 중국어 병음(拼音) 파닉스 학습자 메타 — 한/영 평행 구조.
 *
 * 데이터 source: `CHINESE_PHONICS_CURRICULUM` (`@tangobook/shared`).
 * 🔴 **MVP = Level 1**(단운모 6 + 성조). 유닛마다 활동 하나 = **듣고 고르기**(`word-listen-choose`)를
 *    재사용한다 — 배우기(exploreFirst 탐색: 눌러 듣기 = Listen and repeat) → 퀴즈가 한 화면에서 흐른다.
 *    성조 유닛(u03)도 같은 활동으로 4성을 듣고 고른다(별도 컴포넌트 없이 「듣고 성조 고르기」).
 *    L2~L5(성모 블렌딩·게임)는 후속 — 그때 영어 CVC 활동/게임 어댑터를 물린다.
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

/** 화면에 깔리는 병음 카드 한 장 — `label`=보이는 병음, `pinyin`=발음 조회 키. */
export interface PinyinCard {
  label: string;
  pinyin: string;
}

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

/**
 * 유닛 카드 = 표시 병음. 단운모 유닛은 낱 모음(a·o·e), 성조 유닛은 4성(mā má mǎ mà).
 * `sampleWords` 가 곧 표시 병음이라 그대로 카드로 쓴다(발음 키도 동일 — `pinyin-audio` 가 한자 매핑).
 */
export function getChineseUnitCards(unitId: string): PinyinCard[] {
  const u = getChineseUnit(unitId);
  if (!u) return [];
  return u.targetWords.map((w) => ({ label: w, pinyin: w }));
}

/** 성조 유닛인가 — 안내/제목 톤을 가른다(같은 활동, 성조 4개가 보기). */
export function isToneUnit(unitId: string): boolean {
  return getChineseUnit(unitId)?.patterns.includes('tones') ?? false;
}

/**
 * L1 활동 plan — 유닛마다 「듣고 고르기」 한 장(learn).
 * 🔴 게임/storybook 의존 없음 — 병음 낱말 카드·keypoints 는 후속(L2+). 새 활동 컴포넌트 0.
 */
function makeLevel1Plan(): ActivityPlan {
  return {
    activities: [
      {
        key: 'listen-choose',
        order: 1,
        kind: 'word-listen-choose',
        section: 'learn',
        title: '듣고 고르기',
        emoji: '🔊',
        required: true,
      },
    ],
  };
}

export const CHINESE_UNIT_ACTIVITY_PLAN: Record<string, ActivityPlan> = Object.fromEntries(
  getAllChineseUnits().map((u) => [u.id, makeLevel1Plan()])
);

export function getChineseActivityPlan(unitId: string): ActivityPlan {
  return CHINESE_UNIT_ACTIVITY_PLAN[unitId] ?? { activities: [] };
}

export function getChineseRequiredActivities(unitId: string): readonly string[] {
  return getChineseActivityPlan(unitId)
    .activities.filter((a) => a.required)
    .map((a) => a.key);
}
