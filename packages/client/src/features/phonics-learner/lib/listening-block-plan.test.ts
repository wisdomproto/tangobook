import { expect, it } from 'vitest';
import {
  getAllKoreanUnits,
  getActivityPlan,
  getRequiredActivities,
  KOREAN_UNIT_ACTIVITY_PLAN,
} from './korean-phonics-units';
import {
  getAllEnglishUnits,
  getEnglishActivityPlan,
  ENGLISH_UNIT_ACTIVITY_PLAN,
} from './english-phonics-units';
it('adds only optional listening blocks to existing block chapters without changing required keys or source plans', () => {
  for (const [units, get, source] of [
    [getAllKoreanUnits(), getActivityPlan, KOREAN_UNIT_ACTIVITY_PLAN],
    [getAllEnglishUnits(), getEnglishActivityPlan, ENGLISH_UNIT_ACTIVITY_PLAN],
  ] as const) {
    for (const unit of units) {
      const original = source[unit.id];
      const plan = get(unit.id);
      const blocks = original.activities.filter(
        (a) => a.kind === 'game-korean-block' || a.kind === 'game-english-block'
      );
      const practice = plan.activities.filter((a) => a.listeningPractice);
      expect(practice).toHaveLength(blocks.length ? 1 : 0);
      expect(plan.activities.filter((a) => a.required).map((a) => a.key)).toEqual(
        original.activities.filter((a) => a.required).map((a) => a.key)
      );
      expect(original.activities.some((a) => a.listeningPractice)).toBe(false);
      expect(new Set(plan.activities.map((a) => a.key)).size).toBe(plan.activities.length);
      for (const a of practice)
        expect(a).toMatchObject({ section: 'play', required: false, title: '듣고 블록 놀이' });
      expect(get(unit.id)).toBe(plan);
    }
  }
  expect(getRequiredActivities('kr-h1-u02')).not.toContain('game-korean-block-listen');
  expect(getEnglishActivityPlan('en-b1-u01').activities.some((a) => a.listeningPractice)).toBe(
    false
  );
});
