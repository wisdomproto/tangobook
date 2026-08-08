import { describe, it, expect } from 'vitest';
import {
  getAllChineseUnits,
  getChineseActivityPlan,
  getChineseListenCards,
  getChineseRequiredActivities,
  getChineseToneChoiceCards,
  getChineseUnitCards,
  isToneUnit,
} from './chinese-phonics-units';

describe('중국어 병음 파닉스 L1 (교안 순서: 성조 먼저)', () => {
  it('L1 = 성조(u01) → 단운모 a o e(u02) → 단운모 i u ü(u03)', () => {
    const units = getAllChineseUnits();
    expect(units.map((u) => u.id)).toEqual(['zh-l1-u01', 'zh-l1-u02', 'zh-l1-u03']);
    // 🔴 첫 유닛 = 성조, 나머지 둘 = 단운모.
    expect(isToneUnit('zh-l1-u01')).toBe(true);
    expect(isToneUnit('zh-l1-u02')).toBe(false);
    expect(isToneUnit('zh-l1-u03')).toBe(false);
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

  it('성조 유닛(u01) = 듣고 배우기 + 성조 듣고 고르기', () => {
    const plan = getChineseActivityPlan('zh-l1-u01');
    expect(plan.activities.map((a) => a.kind)).toEqual([
      'word-listen-choose',
      'word-listen-choose',
    ]);
    expect(plan.activities.map((a) => a.key)).toEqual(['listen-choose', 'tone-choose']);
  });

  it('단운모 유닛(u02·u03) = 듣고 배우기 + 따라쓰기 + 글자 사냥', () => {
    for (const id of ['zh-l1-u02', 'zh-l1-u03']) {
      const kinds = getChineseActivityPlan(id).activities.map((a) => a.kind);
      expect(kinds).toEqual(['word-listen-choose', 'vowel-write', 'letter-hunt']);
    }
  });

  it('성조 유닛 배우기 카드 = 4성 음절(a: ā á ǎ à, 라벨=소리, 시퀀스 없음)', () => {
    expect(getChineseListenCards('zh-l1-u01')).toEqual([
      { label: 'ā', sound: 'ā' },
      { label: 'á', sound: 'á' },
      { label: 'ǎ', sound: 'ǎ' },
      { label: 'à', sound: 'à' },
    ]);
  });

  // 🔴 단운모 배우기 = 낱 모음 카드지만 누르면 그 모음의 4성을 순서로(운모 놀이판, 성조 비교).
  it('단운모 배우기 카드 = 낱 모음 라벨 + 4성 시퀀스', () => {
    expect(getChineseListenCards('zh-l1-u02')).toEqual([
      { label: 'a', sound: 'ā', sounds: ['ā', 'á', 'ǎ', 'à'] },
      { label: 'o', sound: 'ō', sounds: ['ō', 'ó', 'ǒ', 'ò'] },
      { label: 'e', sound: 'ē', sounds: ['ē', 'é', 'ě', 'è'] },
    ]);
    expect(getChineseListenCards('zh-l1-u03')).toEqual([
      { label: 'i', sound: 'ī', sounds: ['ī', 'í', 'ǐ', 'ì'] },
      { label: 'u', sound: 'ū', sounds: ['ū', 'ú', 'ǔ', 'ù'] },
      { label: 'ü', sound: 'ǖ', sounds: ['ǖ', 'ǘ', 'ǚ', 'ǜ'] },
    ]);
  });

  // 🔴 쓰기·사냥은 낱 모음 글자 하나가 목표 — 4성 안 붙는다(tone-1 소릿결만).
  it('쓰기·사냥 카드(getChineseUnitCards) = 낱 모음, 소리 tone-1', () => {
    const cards = getChineseUnitCards('zh-l1-u02');
    expect(cards.map((c) => c.label)).toEqual(['a', 'o', 'e']);
    expect(cards.map((c) => c.sound)).toEqual(['ā', 'ō', 'ē']);
    expect(getChineseUnitCards('zh-l1-u03').map((c) => c.sound)).toEqual(['ī', 'ū', 'ǖ']);
  });

  it('성조 듣고 고르기(u01) = 보기 성조 부호(ā á ǎ à), 소리 4성 음절', () => {
    expect(getChineseToneChoiceCards('zh-l1-u01')).toEqual([
      { label: 'ā', sound: 'ā' },
      { label: 'á', sound: 'á' },
      { label: 'ǎ', sound: 'ǎ' },
      { label: 'à', sound: 'à' },
    ]);
    // 단운모 유닛엔 성조 고르기 카드가 없다.
    expect(getChineseToneChoiceCards('zh-l1-u02')).toEqual([]);
  });
});
