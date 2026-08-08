import { describe, it, expect } from 'vitest';
import {
  getAllChineseUnits,
  getChineseActivityPlan,
  getChineseRequiredActivities,
  getChineseToneChoiceCards,
  getChineseUnitCards,
  isToneUnit,
} from './chinese-phonics-units';

describe('중국어 병음 파닉스 L1', () => {
  it('L1 = 단운모 2 유닛 + 성조 1 유닛', () => {
    const units = getAllChineseUnits();
    expect(units.map((u) => u.id)).toEqual(['zh-l1-u01', 'zh-l1-u02', 'zh-l1-u03']);
  });

  // 🔴 plan 이 없으면 라우트로 도달해도 죽은 코드 — 모든 유닛이 도달 가능한 plan 을 갖는지.
  it('모든 유닛의 plan 첫 활동 = 듣고 배우기(word-listen-choose, required)', () => {
    for (const u of getAllChineseUnits()) {
      const plan = getChineseActivityPlan(u.id);
      expect(plan.activities.length).toBeGreaterThan(0);
      expect(getChineseRequiredActivities(u.id)).toContain('listen-choose');
      expect(plan.activities[0].kind).toBe('word-listen-choose');
    }
  });

  it('단운모 유닛 = 듣고 배우기 + 따라쓰기 + 글자 사냥', () => {
    const kinds = getChineseActivityPlan('zh-l1-u01').activities.map((a) => a.kind);
    expect(kinds).toEqual(['word-listen-choose', 'vowel-write', 'letter-hunt']);
  });

  it('성조 유닛(u03) = 듣고 배우기 + 성조 듣고 고르기', () => {
    expect(isToneUnit('zh-l1-u03')).toBe(true);
    expect(isToneUnit('zh-l1-u01')).toBe(false);
    const plan = getChineseActivityPlan('zh-l1-u03');
    expect(plan.activities.map((a) => a.kind)).toEqual([
      'word-listen-choose',
      'word-listen-choose',
    ]);
    expect(plan.activities.map((a) => a.key)).toEqual(['listen-choose', 'tone-choose']);
  });

  it('단운모 카드 = 보기 낱 모음, 소리 tone-1(ā ō ē)', () => {
    const cards = getChineseUnitCards('zh-l1-u01');
    expect(cards.map((c) => c.label)).toEqual(['a', 'o', 'e']);
    expect(cards.map((c) => c.sound)).toEqual(['ā', 'ō', 'ē']);
    expect(getChineseUnitCards('zh-l1-u02').map((c) => c.sound)).toEqual(['ī', 'ū', 'ǖ']);
  });

  it('성조 유닛 카드 = 4성 음절(라벨=소리)', () => {
    expect(getChineseUnitCards('zh-l1-u03')).toEqual([
      { label: 'mā', sound: 'mā' },
      { label: 'má', sound: 'má' },
      { label: 'mǎ', sound: 'mǎ' },
      { label: 'mà', sound: 'mà' },
    ]);
  });

  it('성조 듣고 고르기 = 보기 성조 부호(ā á ǎ à), 소리 음절(mā…)', () => {
    expect(getChineseToneChoiceCards('zh-l1-u03')).toEqual([
      { label: 'ā', sound: 'mā' },
      { label: 'á', sound: 'má' },
      { label: 'ǎ', sound: 'mǎ' },
      { label: 'à', sound: 'mà' },
    ]);
    // 단운모 유닛엔 성조 고르기 카드가 없다.
    expect(getChineseToneChoiceCards('zh-l1-u01')).toEqual([]);
  });
});
