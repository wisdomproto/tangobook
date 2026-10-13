import { beforeEach, describe, expect, it } from 'vitest';
import {
  journeyProgress,
  journeySteps,
  journeyActivityUrl,
  markJourneyStarted,
  hasJourneyStarted,
} from './learning-journey';
import { markActivityCompleted, markRecentUnit } from './progress-store';

beforeEach(() => localStorage.clear());
describe('guided learning path', () => {
  it('can resume an unfinished first activity without fabricating progress or mixing siblings', () => {
    expect(hasJourneyStarted('english')).toBe(false);
    markJourneyStarted('english');
    expect(hasJourneyStarted('english')).toBe(true);
    expect(journeyProgress('english').completed).toBe(0);
    expect(hasJourneyStarted('korean')).toBe(false);
    localStorage.setItem('tangobook:activeProfileId', 'sibling');
    expect(hasJourneyStarted('english')).toBe(false);
  });
  it('starts at the first vowel, visits do not advance, and earlier gaps are preserved', () => {
    markRecentUnit('korean', 'kr-h1-u02');
    markActivityCompleted('korean', 'kr-v1-g01', 'write-1');
    expect(journeyProgress('korean').current?.activity.key).toBe('listen-1');
    markActivityCompleted('korean', 'kr-v1-u01', 'listen-1');
    expect(journeyProgress('korean').current?.activity.key).toBe('listen-2');
  });
  it('requires a real vowel game after learning, without changing legacy required completion', () => {
    const steps = journeySteps('korean').filter((s) => s.unit.id === 'kr-v1-g01');
    for (const { activity } of steps.filter((s) => s.activity.kind !== 'vowel-listen-game')) {
      markActivityCompleted('korean', 'kr-v1-g01', activity.key);
    }
    expect(journeyProgress('korean').current?.activity.key).toBe('listen-game');
    markActivityCompleted('korean', 'kr-v1-g01', 'listen-game');
    expect(journeyProgress('korean').current?.unit.id).toBe('kr-v1-g02');
  });
  it.each(['korean', 'english'] as const)(
    'connects every %s unit and review, excludes optional asset games, and ends explicitly',
    (lang) => {
      const steps = journeySteps(lang);
      expect(steps.some((s) => s.unit.isReview)).toBe(true);
      expect(steps.some((s) => s.activity.kind === 'game-connect-dots')).toBe(false);
      const progress = journeyProgress(lang, (id) =>
        steps.filter((s) => s.unit.id === id).map((s) => s.activity.key)
      );
      expect(progress.finished).toBe(true);
      expect(progress.current).toBeUndefined();
      expect(progress.completed).toBe(steps.length);
    }
  );
  it('shares actual free-play completion but keeps children and languages separate', () => {
    markActivityCompleted('korean', 'kr-v1-g01', 'listen-1');
    expect(journeyProgress('korean').current?.activity.key).toBe('write-1');
    expect(journeyProgress('english').completed).toBe(0);
    localStorage.setItem('tangobook:activeProfileId', 'sibling');
    expect(journeyProgress('korean').completed).toBe(0);
    expect(journeyActivityUrl('english', 'en-b1-u01', 'letters-learn')).toContain(
      '?mode=curriculum'
    );
  });
});
