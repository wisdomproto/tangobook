import { expect, it } from 'vitest';
import type { LearningEventInsert } from '@tangobook/shared';
import { chooseAdaptiveFreePlay } from './adaptive-free-play';
import { freePlayCatalog } from './free-play-catalog';
function event(
  unit: string,
  index: number,
  props: Partial<LearningEventInsert['metadata']> = {},
  type: 'word_correct' | 'word_wrong' = 'word_correct'
): LearningEventInsert {
  return {
    id: `e${index}`,
    profile_id: 'child',
    created_at: new Date(2026, 9, 1, 0, index).toISOString(),
    event_type: type,
    storybook_id: unit,
    game_type: 'korean-block',
    word: index % 2 ? '아기' : '고기',
    metadata: {
      lang: 'ko',
      source: 'phonics',
      unitId: unit,
      skill: 'building',
      firstAttempt: true,
      learningMode: 'assessment',
      modelVisible: false,
      hintUsed: false,
      independent: true,
      ...props,
    },
  };
}
it.each(['korean', 'english'] as const)(
  '%s starts at its easiest real block content with all help, preserving language and Book1 exclusions',
  (lang) => {
    const choice = chooseAdaptiveFreePlay(lang, 'block', [], () => 0)!;
    const first = freePlayCatalog(lang).find((e) => e.game === 'listenBlock' && !e.unit.isReview)!;
    expect(choice.unitId).toBe(first.unit.id);
    expect(choice.support).toBe('model');
    expect(choice.href).toContain('freePlay=1&support=model');
    expect(choice.href).not.toContain('en-b1');
  }
);
it('curriculum practice and free attempts jointly reduce help, but following a model never counts as independent', () => {
  const unit = 'kr-h1-u02';
  const practice = [0, 1, 2].map((i) =>
    event(unit, i, {
      skill: 'building',
      learningMode: 'practice',
      practiceCompleted: true,
      practiceStage: 'block',
      firstAttempt: false,
      independent: false,
      modelVisible: true,
    })
  );
  expect(chooseAdaptiveFreePlay('korean', 'block', practice, () => 1)?.support).toBe('first');
  const assisted = [3, 4, 5, 6, 7, 8].map((i) =>
    event(unit, i, { hintUsed: true, independent: false })
  );
  const choice = chooseAdaptiveFreePlay('korean', 'block', [...practice, ...assisted], () => 1)!;
  expect(choice.unitId).toBe(unit);
  expect(choice.support).toBe('listen');
});
it('recent mistakes increase help and select their own previously practiced unit', () => {
  const events = [
    event('kr-h1-u02', 0),
    event('kr-h1-u02', 1),
    event('kr-h1-u02', 2),
    event('kr-h1-u02', 3, {}, 'word_wrong'),
    event('kr-h1-u02', 4, {}, 'word_wrong'),
  ];
  const choice = chooseAdaptiveFreePlay('korean', 'block', events, () => 1)!;
  expect(choice.support).toBe('model');
  expect(choice.unitId).toBe('kr-h1-u02');
});
it('independent successes open only the next nearby content and deduplicate IDs', () => {
  const events = [0, 1, 2].map((i) => event('kr-h1-u02', i));
  expect(chooseAdaptiveFreePlay('korean', 'block', events, () => 1)?.unitId).toBe('kr-h1-u03');
  const repeated = [events[0], events[0], events[0]];
  expect(chooseAdaptiveFreePlay('korean', 'block', repeated, () => 1)?.unitId).toBe('kr-h1-u02');
});
it('tracing and coloring are not evidence of unaided spelling, and Korean history does not advance English', () => {
  const history = [0, 1, 2, 3, 4, 5].map((i) =>
    event('kr-h1-u02', i, {
      skill: 'tracing',
      practiceCompleted: true,
      modelVisible: true,
      independent: false,
    })
  );
  const choice = chooseAdaptiveFreePlay('korean', 'wordWrite', history, () => 1)!;
  expect(choice.support).toBe('first');
  expect(chooseAdaptiveFreePlay('english', 'block', history, () => 0)?.support).toBe('model');
});
