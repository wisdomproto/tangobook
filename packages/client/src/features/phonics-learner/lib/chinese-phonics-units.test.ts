import { describe, it, expect } from 'vitest';
import {
  getAllChineseUnits,
  getChineseActivityPlan,
  getChineseRequiredActivities,
  getChineseUnitCards,
  isToneUnit,
} from './chinese-phonics-units';
import { PINYIN_TTS_HANZI } from './pinyin-audio';

describe('중국어 병음 파닉스 L1', () => {
  it('L1 = 단운모 2 유닛 + 성조 1 유닛', () => {
    const units = getAllChineseUnits();
    expect(units.map((u) => u.id)).toEqual(['zh-l1-u01', 'zh-l1-u02', 'zh-l1-u03']);
  });

  // 🔴 plan 이 없으면 라우트로 도달해도 죽은 코드 — 모든 유닛이 required 활동을 갖는지.
  it('모든 유닛에 도달 가능한 plan(required 듣고 고르기)이 있다', () => {
    for (const u of getAllChineseUnits()) {
      const plan = getChineseActivityPlan(u.id);
      expect(plan.activities.length).toBeGreaterThan(0);
      expect(getChineseRequiredActivities(u.id)).toContain('listen-choose');
      expect(plan.activities[0].kind).toBe('word-listen-choose');
    }
  });

  it('성조 유닛(u03)만 tone, 카드 4장(4성)', () => {
    expect(isToneUnit('zh-l1-u03')).toBe(true);
    expect(isToneUnit('zh-l1-u01')).toBe(false);
    expect(getChineseUnitCards('zh-l1-u03').map((c) => c.label)).toEqual(['mā', 'má', 'mǎ', 'mà']);
    expect(getChineseUnitCards('zh-l1-u01').map((c) => c.label)).toEqual(['a', 'o', 'e']);
  });

  // 🔴 발음은 대표 한자 매핑을 타야 소리가 난다(bare 병음은 cmn-CN TTS 가 못 읽음).
  //    L1 의 모든 카드가 한자 매핑을 갖는지 — 빠지면 그 카드는 무음이다.
  it('L1 전 카드가 대표 한자 발음 매핑을 갖는다', () => {
    for (const u of getAllChineseUnits()) {
      for (const c of getChineseUnitCards(u.id)) {
        expect(PINYIN_TTS_HANZI[c.pinyin], `${c.pinyin} 발음 매핑 누락`).toBeTruthy();
      }
    }
  });
});
