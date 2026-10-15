import { beforeEach, describe, expect, it } from 'vitest';
import {
  journeyProgress,
  journeySteps,
  journeyActivityUrl,
  markJourneyStarted,
  hasJourneyStarted,
  journeyUnits,
  journeyKoreanActivityRoute,
} from './learning-journey';
import { markActivityCompleted, markRecentUnit, getUnitProgress } from './progress-store';

beforeEach(() => localStorage.clear());
describe('guided learning path', () => {
  it('grandfathers old completed consonant chapters without faking the new finding activity', () => {
    const first = 'kr-h1-u02';
    const next = 'kr-h1-u03';
    const steps = journeySteps('korean');
    const baseline = (id: string) =>
      steps.filter(
        (s) => s.unit.id === id && !['word-learning', 'consonant-find'].includes(s.activity.kind)
      );
    baseline(first).forEach((s) => markActivityCompleted('korean', first, s.activity.key));
    const migrated = journeyProgress('korean');
    expect(
      migrated.steps.some((s) => s.unit.id === first && s.activity.kind === 'consonant-find')
    ).toBe(false);
    expect(getUnitProgress('korean', first).completedActivities).not.toContain('consonant-find');
    // The initial snapshot also locks in that a new unfinished chapter must really play the game.
    baseline(next).forEach((s) => markActivityCompleted('korean', next, s.activity.key));
    expect(
      journeyProgress('korean').steps.some(
        (s) => s.unit.id === next && s.activity.kind === 'consonant-find'
      )
    ).toBe(true);
    localStorage.setItem('tangobook:activeProfileId', 'new-child');
    expect(
      journeyProgress('korean').steps.some(
        (s) => s.unit.id === first && s.activity.kind === 'consonant-find'
      )
    ).toBe(true);
  });
  it('adds practice to new chapters without inventing new completion for an old finished chapter', () => {
    const oldKeys = journeySteps('english')
      .filter((s) => s.unit.id === 'en-b1-u01' && s.activity.kind !== 'word-learning')
      .map((s) => s.activity.key);
    oldKeys.forEach((key) => markActivityCompleted('english', 'en-b1-u01', key));
    const migrated = journeyProgress('english');
    expect(
      migrated.steps.some((s) => s.unit.id === 'en-b1-u01' && s.activity.kind === 'word-learning')
    ).toBe(false);
    expect(
      migrated.steps.some((s) => s.unit.id === 'en-b1-u02' && s.activity.kind === 'word-learning')
    ).toBe(true);
    expect(getUnitProgress('english', 'en-b1-u01').completedActivities).not.toContain(
      'word-learning'
    );
    oldKeys.forEach((key) => markActivityCompleted('english', 'en-b1-u02', key));
    expect(journeyProgress('english').current?.activity.kind).toBe('word-learning');
    localStorage.setItem('tangobook:activeProfileId', 'other-child');
    expect(
      journeyProgress('english').steps.some(
        (s) => s.unit.id === 'en-b1-u01' && s.activity.kind === 'word-learning'
      )
    ).toBe(true);
  });
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
    expect(journeyProgress('korean').current?.unit.id).toBe('kr-v1-u02');
    expect(journeyProgress('korean').current?.activity.key).toBe('listen-1');
  });
  it('requires a real vowel game after learning, without changing legacy required completion', () => {
    markActivityCompleted('korean', 'kr-v1-u01', 'listen-1');
    markActivityCompleted('korean', 'kr-v1-u01', 'write-1');
    const steps = journeySteps('korean').filter((s) => s.unit.id === 'kr-v1-u02');
    for (const { activity } of steps.filter((s) => s.activity.kind !== 'vowel-listen-game')) {
      markActivityCompleted('korean', 'kr-v1-u02', activity.key);
    }
    expect(journeyProgress('korean').current?.activity.key).toBe('listen-game');
    markActivityCompleted('korean', 'kr-v1-u02', 'listen-game');
    expect(journeyProgress('korean').current?.unit.id).toBe('kr-v1-u03');
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
  it('splits each introductory vowel into one guided chapter while mapping old grouped links exactly', () => {
    expect(
      journeyUnits('korean')
        .filter((unit) => unit.levelKey === 'hangul-vowels')
        .map((unit) => unit.phonemes)
    ).toEqual(Array.from('ㅏㅑㅓㅕㅗㅛㅜㅠㅡㅣ').map((vowel) => [vowel]));
    expect(journeyKoreanActivityRoute('kr-v1-g01', 'write-3')).toEqual({
      unitId: 'kr-v1-u03',
      activityKey: 'write-1',
    });
    expect(journeyKoreanActivityRoute('kr-v1-u02', 'listen-1')).toEqual({
      unitId: 'kr-v1-u02',
      activityKey: 'listen-1',
    });
    expect(
      journeySteps('korean')
        .filter((step) => step.unit.id === 'kr-v1-u01')
        .map((step) => step.activity.key)
    ).toEqual(['listen-1', 'write-1']);
  });
});

it('old completed blending remains recorded but the new standalone letter step must actually be done', () => {
  const steps = journeySteps('korean');
  const first = steps.findIndex((s) => s.unit.id === 'kr-h1-u02');
  steps.slice(0, first).forEach((s) => markActivityCompleted('korean', s.unit.id, s.activity.key));
  const prior = ['consonant-tap', 'blend-listen', 'consonant-write'];
  prior.forEach((key) => markActivityCompleted('korean', 'kr-h1-u02', key));
  expect(journeyProgress('korean').current?.activity.key).toBe('letter-write');
});
