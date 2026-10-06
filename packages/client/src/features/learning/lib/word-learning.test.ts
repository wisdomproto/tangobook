import { describe, expect, it } from 'vitest';
import type { Lang, LearningEvent } from '@tangobook/shared';
import { periodStart, phonicsTargets, summarizeWords } from './word-learning';
const event = (
  id: string,
  type: LearningEvent['event_type'],
  word = '오리',
  lang: Lang = 'ko'
): LearningEvent => ({
  id,
  profile_id: 'p',
  event_type: type,
  word,
  storybook_id: 'b',
  game_type: null,
  metadata: { lang },
  created_at: '2026-10-05T03:00:00Z',
});
describe('evidence-based word report', () => {
  it('separates encounters from direct practice and ignores auxiliary syllable events', () => {
    const events = [
      event('1', 'word_exposed'),
      event('2', 'word_correct'),
      event('3', 'syllable_correct'),
    ];
    const word = summarizeWords([...events, events[1]], 'ko')[0];
    expect(word.exposures).toBe(1);
    expect(word.practices).toBe(1);
    expect(word.skills.legacy?.attempts).toBe(1);
  });
  it('keeps English case variants together, but different languages apart', () => {
    const events = [
      event('1', 'word_exposed', 'Apple', 'en'),
      event('2', 'word_correct', 'apple', 'en'),
      event('3', 'word_exposed', 'apple', 'vi'),
    ];
    expect(summarizeWords(events, 'en')).toHaveLength(1);
    expect(summarizeWords(events, 'en')[0].exposures).toBe(1);
    expect(summarizeWords(events, 'vi')[0].practices).toBe(0);
  });
  it('retains explicit evidence, and never upgrades legacy records to a measured skill', () => {
    const old = event('1', 'word_correct');
    const current = event('2', 'word_correct');
    current.metadata = { lang: 'ko', skill: 'tracing', evidence: 'completion', source: 'phonics' };
    const word = summarizeWords([old, current], 'ko')[0];
    expect(word.skills.legacy?.attempts).toBe(1);
    expect(word.skills.tracing?.attempts).toBe(1);
    expect(word.phonicsPractices).toBe(1);
  });
  it('does not infer unknown multilingual records as Korean or English', () => {
    const unknown = event('1', 'word_exposed', 'แมว', 'th');
    unknown.metadata = null;
    expect(summarizeWords([unknown], 'ko')).toEqual([]);
    expect(summarizeWords([event('2', 'word_exposed', 'แมว', 'th')], 'th')).toHaveLength(1);
  });
  it('maps shared vocabulary to Korean and English phonics targets', () => {
    expect(phonicsTargets('apple', 'en').length).toBeGreaterThan(0);
    expect(phonicsTargets('Apple', 'en')).toEqual(phonicsTargets('apple', 'en'));
    expect(phonicsTargets('매우긴없는낱말', 'ko')).toEqual([]);
  });
  it('uses local calendar days for period boundaries', () => {
    const now = new Date(2026, 9, 5, 23, 10);
    expect(periodStart('today', now)).toEqual(new Date(2026, 9, 5));
    expect(periodStart('week', now)).toEqual(new Date(2026, 8, 29));
  });
});

it('does not infer a legacy bilingual canonical label as an English learning experience', () => {
  const old = event('legacy', 'word_exposed', 'duck', 'en');
  old.metadata = { korean: '오리', source: 'storybook' };
  expect(summarizeWords([old], 'en')).toEqual([]);
});
