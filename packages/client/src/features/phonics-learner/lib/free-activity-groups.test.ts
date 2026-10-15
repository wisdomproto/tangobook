import { expect, it } from 'vitest';
import { freeActivityGroups, freeWritingCompanion } from './free-activity-groups';
import { getAllKoreanUnits, getActivityPlan } from './korean-phonics-units';
import { getAllEnglishUnits, getEnglishActivityPlan } from './english-phonics-units';

it('pairs the exact vowel or consonant, never a neighboring letter or game', () => {
  const vowels = getActivityPlan('kr-v1-g01').activities;
  expect(freeWritingCompanion(vowels, 'listen-2')?.key).toBe('write-2');
  expect(freeWritingCompanion(vowels, 'hunt-game')).toBeUndefined();
  const consonant = getActivityPlan('kr-h1-u02').activities;
  expect(freeWritingCompanion(consonant, 'consonant-tap')?.key).toBe('letter-write');
  expect(freeWritingCompanion(consonant, 'blend-listen')?.key).toBe('consonant-write');
  expect(freeWritingCompanion(consonant, 'letter-write')).toBeUndefined();
});
it('pairs English letters and leaves already integrated word-family activities intact', () => {
  expect(
    freeWritingCompanion(getEnglishActivityPlan('en-b1-u01').activities, 'letters-learn')?.key
  ).toBe('letters-write');
  for (const unit of getAllEnglishUnits().filter((unit) => unit.levelIndex > 1)) {
    const plan = getEnglishActivityPlan(unit.id).activities;
    expect(freeActivityGroups(plan).map((entry) => entry.activity.key)).toEqual(
      plan
        .filter((a) => !['game-dots', 'game-english-block', 'game-word-writing'].includes(a.key))
        .map((activity) => activity.key)
    );
  }
});
it('groups phoneme writing and replaces duplicate word-practice entries while preserving their routes', () => {
  for (const lang of ['korean', 'english'] as const) {
    const units = lang === 'korean' ? getAllKoreanUnits() : getAllEnglishUnits();
    for (const unit of units) {
      const activities = (
        lang === 'korean' ? getActivityPlan(unit.id) : getEnglishActivityPlan(unit.id)
      ).activities;
      expect(
        freeActivityGroups(activities)
          .flatMap((entry) => entry.keys)
          .sort()
      ).toEqual(
        activities
          .filter(
            (a) =>
              !activities.some((item) => item.kind === 'word-learning') ||
              ![
                'game-dots',
                'game-korean-block',
                'game-english-block',
                'game-word-writing',
              ].includes(a.key)
          )
          .map((activity) => activity.key)
          .sort()
      );
      if (activities.some((a) => a.kind === 'word-learning')) {
        expect(activities.some((a) => a.key === 'game-word-writing')).toBe(true);
        expect(
          freeActivityGroups(activities).filter((g) => g.activity.kind === 'word-learning')
        ).toHaveLength(1);
      }
    }
  }
});
