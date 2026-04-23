import { describe, it, expect } from 'vitest';
import type { LearningEvent, LearningEventType } from '@tangobook/shared';
import { groupByWord, groupBySyllable, groupByPhoneme, countDistinctBooks } from './aggregate';

let idSeq = 0;
function ev(partial: Partial<LearningEvent>): LearningEvent {
  idSeq += 1;
  return {
    id: `e-${idSeq}`,
    profile_id: 'p1',
    event_type: 'word_exposed' as LearningEventType,
    storybook_id: null,
    game_type: null,
    word: null,
    metadata: {},
    created_at: new Date(2026, 3, 23, 0, 0, idSeq).toISOString(),
    ...partial,
  };
}

describe('groupByWord', () => {
  it('merges exposed + correct + wrong per word', () => {
    const events = [
      ev({ event_type: 'word_exposed', word: 'cat', metadata: { lang: 'en' } }),
      ev({ event_type: 'word_correct', word: 'cat', metadata: { lang: 'en' } }),
      ev({ event_type: 'word_wrong', word: 'cat', metadata: { lang: 'en' } }),
      ev({ event_type: 'word_exposed', word: 'dog', metadata: { lang: 'en' } }),
    ];
    const r = groupByWord(events, 'en');
    const cat = r.get('cat')!;
    expect(cat.exposed).toBe(3);
    expect(cat.correct).toBe(1);
    expect(cat.wrong).toBe(1);
    expect(r.get('dog')!.exposed).toBe(1);
  });

  it('filters by lang', () => {
    const events = [
      ev({ event_type: 'word_exposed', word: 'cat', metadata: { lang: 'en' } }),
      ev({ event_type: 'word_exposed', word: '고양이', metadata: { lang: 'ko' } }),
    ];
    expect(groupByWord(events, 'en').size).toBe(1);
    expect(groupByWord(events, 'ko').size).toBe(1);
    expect(groupByWord(events, 'en').has('cat')).toBe(true);
  });

  it('counts word_spoken as correct', () => {
    const events = [ev({ event_type: 'word_spoken', word: 'cat', metadata: { lang: 'en' } })];
    const cat = groupByWord(events, 'en').get('cat')!;
    expect(cat.correct).toBe(1);
    expect(cat.exposed).toBe(1);
  });

  it('tracks lastAt as max created_at', () => {
    const events = [
      ev({
        event_type: 'word_exposed',
        word: 'cat',
        metadata: { lang: 'en' },
        created_at: '2026-04-01T00:00:00Z',
      }),
      ev({
        event_type: 'word_correct',
        word: 'cat',
        metadata: { lang: 'en' },
        created_at: '2026-04-20T00:00:00Z',
      }),
    ];
    expect(groupByWord(events, 'en').get('cat')!.lastAt).toBe('2026-04-20T00:00:00Z');
  });
});

describe('groupBySyllable', () => {
  it('keys by consonant+vowel from metadata', () => {
    const events = [
      ev({
        event_type: 'syllable_correct',
        word: '가',
        metadata: { lang: 'ko', consonant: 'ㄱ', vowel: 'ㅏ' },
      }),
      ev({
        event_type: 'syllable_wrong',
        word: '가',
        metadata: { lang: 'ko', consonant: 'ㄱ', vowel: 'ㅏ' },
      }),
      ev({
        event_type: 'syllable_correct',
        word: '나',
        metadata: { lang: 'ko', consonant: 'ㄴ', vowel: 'ㅏ' },
      }),
    ];
    const r = groupBySyllable(events);
    expect(r.get('ㄱㅏ')!.correct).toBe(1);
    expect(r.get('ㄱㅏ')!.wrong).toBe(1);
    expect(r.get('ㄴㅏ')!.correct).toBe(1);
  });

  it('ignores events without consonant/vowel', () => {
    const events = [ev({ event_type: 'syllable_correct', word: '가', metadata: { lang: 'ko' } })];
    expect(groupBySyllable(events).size).toBe(0);
  });
});

describe('groupByPhoneme', () => {
  it('keys by phoneme from metadata', () => {
    const events = [
      ev({ event_type: 'phoneme_correct', word: 'shoe', metadata: { lang: 'en', phoneme: 'sh' } }),
      ev({ event_type: 'phoneme_wrong', word: 'ship', metadata: { lang: 'en', phoneme: 'sh' } }),
    ];
    expect(groupByPhoneme(events).get('sh')!.correct).toBe(1);
    expect(groupByPhoneme(events).get('sh')!.wrong).toBe(1);
  });
});

describe('countDistinctBooks', () => {
  it('counts unique storybook_ids from page_read events', () => {
    const events = [
      ev({ event_type: 'page_read', storybook_id: 'b1', metadata: { lang: 'ko', page: 1 } }),
      ev({ event_type: 'page_read', storybook_id: 'b1', metadata: { lang: 'ko', page: 2 } }),
      ev({ event_type: 'page_read', storybook_id: 'b2', metadata: { lang: 'ko', page: 1 } }),
      ev({ event_type: 'page_read', storybook_id: 'b3', metadata: { lang: 'en', page: 1 } }),
    ];
    expect(countDistinctBooks(events, 'ko')).toBe(2);
    expect(countDistinctBooks(events, 'en')).toBe(1);
  });
});
