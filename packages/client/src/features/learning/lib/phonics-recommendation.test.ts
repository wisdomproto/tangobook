import { describe, it, expect } from 'vitest';
import type { LearningEvent } from '@tangobook/shared';
import { summarizeWords } from './word-learning';
import { recommendPhonics } from './phonics-recommendation';

const now = Date.parse('2026-10-05T08:00:00Z');
let sequence = 0;
function trial(
  word: string,
  type: LearningEvent['event_type'],
  age = 0,
  metadata: LearningEvent['metadata'] = {}
): LearningEvent {
  return {
    id: String(sequence++),
    profile_id: 'qa',
    word,
    event_type: type,
    storybook_id: null,
    game_type: 'korean-block',
    created_at: new Date(now - age * 86400000).toISOString(),
    metadata: {
      lang: 'ko',
      source: 'phonics',
      skill: 'building',
      evidence: 'first-attempt',
      firstAttempt: true,
      ...metadata,
    },
  };
}
const recommendation = (events: LearningEvent[]) =>
  recommendPhonics(summarizeWords(events, 'ko'), now);
describe('evidence-based next phonics play', () => {
  it('prioritizes repeated recent misses even after phonics practice, over a new exposed word', () => {
    const result = recommendation([
      trial('고기', 'word_wrong', 1),
      trial('고기', 'word_wrong', 2),
      trial('아기', 'word_exposed', 0, { source: 'storybook' }),
    ]);
    expect(result?.word.word).toBe('고기');
    expect(result?.reason).toBe('needs-review');
  });
  it('changes the suggestion after two more recent successful first attempts', () => {
    const result = recommendation([
      trial('고기', 'word_wrong', 3),
      trial('고기', 'word_wrong', 4),
      trial('고기', 'word_correct', 1),
      trial('고기', 'word_correct', 0),
      trial('아기', 'word_exposed', 0, { source: 'storybook' }),
    ]);
    expect(result?.word.word).toBe('아기');
    expect(result?.reason).toBe('not-practiced');
  });
  it('does not diagnose weakness from exposures, speech, writing completion or old trial evidence', () => {
    const rows = [
      trial('고기', 'word_wrong', 20),
      trial('고기', 'word_wrong', 21),
      trial('아기', 'word_wrong', 0, { skill: 'tracing', evidence: 'completion' }),
      trial('아기', 'word_wrong', 1, { skill: 'tracing', evidence: 'completion' }),
      trial('가구', 'word_spoken'),
    ];
    expect(recommendation(rows)).toBeNull();
  });
  it('does not add misses from different skills together or trust legacy/future results', () => {
    expect(
      recommendation([
        trial('고기', 'word_wrong', 0),
        trial('고기', 'word_wrong', 1, { skill: 'meaning' }),
        trial('고기', 'word_wrong', -1),
        trial('고기', 'word_wrong', 0, { evidence: undefined }),
      ])
    ).toBeNull();
  });
  it('deduplicates replayed IDs before assessing difficulty and keeps languages apart', () => {
    const miss = trial('고기', 'word_wrong');
    expect(recommendation([miss, miss, trial('고기', 'word_wrong', 0, { lang: 'en' })])).toBeNull();
  });
  it('never recommends unrelated curriculum or claims completion/mastery', () => {
    expect(
      recommendation([
        trial('수수께끼외계어', 'word_wrong'),
        trial('수수께끼외계어', 'word_wrong', 1),
      ])
    ).toBeNull();
  });
});
