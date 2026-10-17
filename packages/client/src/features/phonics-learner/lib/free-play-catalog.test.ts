import { beforeEach, expect, it } from 'vitest';
import { freePlayCatalog } from './free-play-catalog';
import { getActivityPlan } from './korean-phonics-units';
import { getEnglishActivityPlan } from './english-phonics-units';
import { markJourneyStarted, journeyProgress } from './learning-journey';

beforeEach(() => localStorage.clear());
it.each(['korean', 'english'] as const)(
  '%s catalog exposes only real routes and does not alter curriculum resume',
  (lang) => {
    markJourneyStarted(lang, lang === 'korean' ? 'hangul2' : 'book3');
    const before = JSON.stringify(journeyProgress(lang));
    const entries = freePlayCatalog(lang);
    expect(entries.length).toBeGreaterThan(100);
    expect(new Set(entries.map((e) => e.href)).size).toBe(entries.length);
    for (const entry of entries) {
      const plan =
        lang === 'korean' ? getActivityPlan(entry.unit.id) : getEnglishActivityPlan(entry.unit.id);
      expect(plan.activities.some((a) => a.key === entry.activity.key)).toBe(true);
      expect(entry.href).not.toContain('mode=curriculum');
    }
    expect(JSON.stringify(journeyProgress(lang))).toBe(before);
  }
);
it('word blocks start at English Book2, listening blocks stay assessment, writing/coloring stay practice', () => {
  const entries = freePlayCatalog('english');
  expect(
    entries.filter((e) => e.game === 'wordWrite').every((e) => !e.unit.id.startsWith('en-b1'))
  ).toBe(true);
  expect(
    entries.some(
      (e) => e.game === 'trace' && e.unit.id.startsWith('en-b1') && e.href.endsWith('?part=write')
    )
  ).toBe(true);
  expect(
    entries.filter((e) => e.game === 'block').every((e) => !e.unit.id.startsWith('en-b1'))
  ).toBe(true);
  expect(entries.filter((e) => e.game === 'listenBlock').length).toBeGreaterThan(0);
  expect(
    entries.filter((e) => e.game === 'listenBlock').every((e) => e.activity.key.endsWith('-listen'))
  ).toBe(true);
  expect(
    entries
      .filter((e) => e.game === 'wordWrite')
      .every((e) => e.href.endsWith('?part=write') || e.activity.kind === 'review-write')
  ).toBe(true);
  expect(
    entries.filter((e) => e.game === 'color').every((e) => e.href.endsWith('?part=color'))
  ).toBe(true);
});
