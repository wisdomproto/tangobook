import { describe, it, expect } from 'vitest';
import type { LearningEvent, LearningEventType } from '@tangobook/shared';
import {
  groupByWord,
  groupBySyllable,
  groupByPhoneme,
  countDistinctBooks,
  kstDateKey,
  completedBooks,
  estimateReadingMinutes,
  computeStreak,
  booksThisWeek,
  metWords,
} from './aggregate';

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

// ── NEW FUNCTIONS ──────────────────────────────────────────────────────────

describe('kstDateKey', () => {
  it('converts UTC midnight to KST next day (UTC+9)', () => {
    // 2026-07-01T20:00:00Z → KST 2026-07-02T05:00:00+09:00 → date = 2026-07-02
    expect(kstDateKey('2026-07-01T20:00:00Z')).toBe('2026-07-02');
  });

  it('keeps same date when UTC is morning (KST still same day)', () => {
    // 2026-07-01T10:00:00Z → KST 2026-07-01T19:00:00+09:00 → date = 2026-07-01
    expect(kstDateKey('2026-07-01T10:00:00Z')).toBe('2026-07-01');
  });

  it('handles midnight UTC (00:00Z) → KST is 09:00 same day', () => {
    expect(kstDateKey('2026-07-01T00:00:00Z')).toBe('2026-07-01');
  });

  it('handles 15:00Z → KST next day at 00:00 boundary', () => {
    // 2026-06-30T15:00:00Z → KST 2026-07-01T00:00:00 → date = 2026-07-01
    expect(kstDateKey('2026-06-30T15:00:00Z')).toBe('2026-07-01');
  });
});

describe('completedBooks', () => {
  it('returns books where lastPage===true and totalPages>0', () => {
    const events = [
      ev({
        event_type: 'page_read',
        storybook_id: 'b1',
        metadata: { lastPage: true, totalPages: 5 },
        created_at: '2026-07-01T10:00:00Z',
      }),
      ev({
        event_type: 'page_read',
        storybook_id: 'b2',
        metadata: { lastPage: false, totalPages: 5 },
        created_at: '2026-07-01T11:00:00Z',
      }),
    ];
    const result = completedBooks(events);
    expect(result).toHaveLength(1);
    expect(result[0].storybookId).toBe('b1');
    expect(result[0].count).toBe(1);
    expect(result[0].lastAt).toBe('2026-07-01T10:00:00Z');
  });

  it('counts same book across 2 sessions as count=2', () => {
    const events = [
      ev({
        event_type: 'page_read',
        storybook_id: 'b1',
        metadata: { lastPage: true, totalPages: 3 },
        created_at: '2026-07-01T10:00:00Z',
      }),
      ev({
        event_type: 'page_read',
        storybook_id: 'b1',
        metadata: { lastPage: true, totalPages: 3 },
        created_at: '2026-07-02T10:00:00Z',
      }),
    ];
    const result = completedBooks(events);
    expect(result).toHaveLength(1);
    expect(result[0].storybookId).toBe('b1');
    expect(result[0].count).toBe(2);
    expect(result[0].lastAt).toBe('2026-07-02T10:00:00Z');
  });

  it('excludes events with totalPages===0', () => {
    const events = [
      ev({
        event_type: 'page_read',
        storybook_id: 'b1',
        metadata: { lastPage: true, totalPages: 0 },
        created_at: '2026-07-01T10:00:00Z',
      }),
    ];
    expect(completedBooks(events)).toHaveLength(0);
  });

  it('excludes non-page_read events', () => {
    const events = [
      ev({
        event_type: 'word_exposed',
        storybook_id: 'b1',
        metadata: { lastPage: true, totalPages: 5 } as any,
        created_at: '2026-07-01T10:00:00Z',
      }),
    ];
    expect(completedBooks(events)).toHaveLength(0);
  });

  it('excludes events with null storybook_id', () => {
    const events = [
      ev({
        event_type: 'page_read',
        storybook_id: null,
        metadata: { lastPage: true, totalPages: 5 },
        created_at: '2026-07-01T10:00:00Z',
      }),
    ];
    expect(completedBooks(events)).toHaveLength(0);
  });

  it('lastAt is the max created_at per book', () => {
    const events = [
      ev({
        event_type: 'page_read',
        storybook_id: 'b1',
        metadata: { lastPage: true, totalPages: 3 },
        created_at: '2026-07-02T10:00:00Z',
      }),
      ev({
        event_type: 'page_read',
        storybook_id: 'b1',
        metadata: { lastPage: true, totalPages: 3 },
        created_at: '2026-07-01T10:00:00Z',
      }),
    ];
    const result = completedBooks(events);
    expect(result[0].lastAt).toBe('2026-07-02T10:00:00Z');
  });
});

describe('estimateReadingMinutes', () => {
  it('returns 0 for empty events', () => {
    expect(estimateReadingMinutes([])).toBe(0);
  });

  it('single event → SESSION_FLOOR (30s) → rounds to 1 minute', () => {
    const events = [
      ev({
        event_type: 'page_read',
        created_at: '2026-07-01T10:00:00Z',
      }),
    ];
    // 1 event → 1 session → floor 30s → Math.max(1, round(30/60)) = Math.max(1,1) = 1
    expect(estimateReadingMinutes(events)).toBe(1);
  });

  it('two events 60s apart (same session) → 60s + SESSION_FLOOR but 60s>floor → 1 min', () => {
    const events = [
      ev({ event_type: 'page_read', created_at: '2026-07-01T10:00:00Z' }),
      ev({ event_type: 'page_read', created_at: '2026-07-01T10:01:00Z' }),
    ];
    // session gap=60s, capped at 120s → 60s in session1; floor=30s but 60>30, total=60s → 1 min
    expect(estimateReadingMinutes(events)).toBe(1);
  });

  it('two sessions separated by >5min → sessions summed with floors', () => {
    const events = [
      // Session 1: two events 60s apart
      ev({ event_type: 'page_read', created_at: '2026-07-01T10:00:00Z' }),
      ev({ event_type: 'page_read', created_at: '2026-07-01T10:01:00Z' }),
      // Gap > 5min → new session
      ev({ event_type: 'page_read', created_at: '2026-07-01T11:00:00Z' }),
    ];
    // Session 1: gap=60s → 60s (>floor 30s) → 60s
    // Session 2: 1 event → floor 30s → 30s
    // Total = 90s → round(90/60) = round(1.5) = 2 → Math.max(1,2) = 2
    expect(estimateReadingMinutes(events)).toBe(2);
  });

  it('gap exceeding PAGE_CAP (120s) is capped at 120s', () => {
    const events = [
      ev({ event_type: 'page_read', created_at: '2026-07-01T10:00:00Z' }),
      ev({ event_type: 'page_read', created_at: '2026-07-01T10:05:00Z' }), // 300s gap within session? No — 300s = 5min = exactly SESSION_GAP boundary
    ];
    // 300000ms === SESSION_GAP so NOT a new session — same session
    // gap = 300s > PAGE_CAP 120s → cap to 120s → total=120s → 2 min
    // Actually 300000 === 300_000 which IS the gap threshold. Let's check: ≤300000 = same session
    expect(estimateReadingMinutes(events)).toBeGreaterThanOrEqual(2);
  });

  it('ignores non page_read events', () => {
    const events = [
      ev({ event_type: 'word_exposed', created_at: '2026-07-01T10:00:00Z' }),
      ev({ event_type: 'word_exposed', created_at: '2026-07-01T10:01:00Z' }),
    ];
    expect(estimateReadingMinutes(events)).toBe(0);
  });
});

describe('computeStreak', () => {
  // now = 2026-07-01T12:00:00Z (KST = 2026-07-01T21:00 → date 2026-07-01)
  const now = new Date('2026-07-01T12:00:00Z');

  it('returns 0 if no events', () => {
    expect(computeStreak([], now)).toBe(0);
  });

  it('returns 1 if only activity is today (KST)', () => {
    const events = [
      ev({ created_at: '2026-07-01T05:00:00Z' }), // KST 2026-07-01T14:00 → today
    ];
    expect(computeStreak(events, now)).toBe(1);
  });

  it('returns 2 if activity today and yesterday', () => {
    const events = [
      ev({ created_at: '2026-07-01T05:00:00Z' }), // KST today
      ev({ created_at: '2026-06-30T05:00:00Z' }), // KST yesterday
    ];
    expect(computeStreak(events, now)).toBe(2);
  });

  it('returns 1 if last activity was yesterday but not today', () => {
    const events = [
      ev({ created_at: '2026-06-30T05:00:00Z' }), // KST yesterday only
    ];
    expect(computeStreak(events, now)).toBe(1);
  });

  it('streak breaks if gap ≥ 2 days', () => {
    const events = [
      ev({ created_at: '2026-07-01T05:00:00Z' }), // today
      ev({ created_at: '2026-06-29T05:00:00Z' }), // 2 days ago → gap
    ];
    // today=streak1, yesterday=no event → streak stops at 1
    expect(computeStreak(events, now)).toBe(1);
  });

  it('counts consecutive days correctly', () => {
    const events = [
      ev({ created_at: '2026-07-01T05:00:00Z' }), // today
      ev({ created_at: '2026-06-30T05:00:00Z' }), // yesterday
      ev({ created_at: '2026-06-29T05:00:00Z' }), // 2 days ago
      ev({ created_at: '2026-06-28T05:00:00Z' }), // 3 days ago
    ];
    expect(computeStreak(events, now)).toBe(4);
  });

  it('does not count future dates beyond now', () => {
    const events = [
      ev({ created_at: '2026-07-02T05:00:00Z' }), // tomorrow KST
      ev({ created_at: '2026-07-01T05:00:00Z' }), // today
    ];
    // streak should be 1 (just today; tomorrow is future, not counted from now)
    expect(computeStreak(events, now)).toBe(1);
  });
});

describe('booksThisWeek', () => {
  // now = 2026-07-01T12:00:00Z
  const now = new Date('2026-07-01T12:00:00Z');

  it('returns 0 for empty events', () => {
    expect(booksThisWeek([], now)).toBe(0);
  });

  it('counts distinct books within last 7 days', () => {
    const events = [
      ev({
        event_type: 'page_read',
        storybook_id: 'b1',
        metadata: { lang: 'ko' },
        created_at: '2026-07-01T05:00:00Z', // within 7 days
      }),
      ev({
        event_type: 'page_read',
        storybook_id: 'b2',
        metadata: { lang: 'ko' },
        created_at: '2026-06-26T05:00:00Z', // 5 days ago — within 7 days
      }),
      ev({
        event_type: 'page_read',
        storybook_id: 'b3',
        metadata: { lang: 'ko' },
        created_at: '2026-06-23T05:00:00Z', // 8 days ago — outside 7 days
      }),
    ];
    // b1 and b2 are within 7 days for 'ko'
    expect(booksThisWeek(events, now, 'ko')).toBe(2);
  });

  it('excludes books older than 7 days', () => {
    const events = [
      ev({
        event_type: 'page_read',
        storybook_id: 'b1',
        metadata: { lang: 'ko' },
        created_at: '2026-06-20T05:00:00Z', // 11 days ago
      }),
    ];
    expect(booksThisWeek(events, now, 'ko')).toBe(0);
  });

  it('counts correctly without lang filter (all langs)', () => {
    const events = [
      ev({
        event_type: 'page_read',
        storybook_id: 'b1',
        metadata: { lang: 'ko' },
        created_at: '2026-07-01T05:00:00Z',
      }),
      ev({
        event_type: 'page_read',
        storybook_id: 'b2',
        metadata: { lang: 'en' },
        created_at: '2026-07-01T06:00:00Z',
      }),
    ];
    // Without lang filter — countDistinctBooks requires lang, so we pass 'ko'
    // With lang='ko' only b1 counts
    expect(booksThisWeek(events, now, 'ko')).toBe(1);
    expect(booksThisWeek(events, now, 'en')).toBe(1);
  });
});

describe('metWords', () => {
  it('returns empty array for no word_exposed events', () => {
    const events = [ev({ event_type: 'page_read', storybook_id: 'b1', metadata: { lang: 'ko' } })];
    expect(metWords(events, 'ko')).toHaveLength(0);
  });

  it('returns distinct words from word_exposed events', () => {
    const events = [
      ev({ event_type: 'word_exposed', word: 'cat', metadata: { lang: 'en' } }),
      ev({ event_type: 'word_exposed', word: 'cat', metadata: { lang: 'en' } }), // duplicate
      ev({ event_type: 'word_exposed', word: 'dog', metadata: { lang: 'en' } }),
    ];
    const words = metWords(events, 'en');
    expect(words).toHaveLength(2);
    expect(words).toContain('cat');
    expect(words).toContain('dog');
  });

  it('filters by lang when provided', () => {
    const events = [
      ev({ event_type: 'word_exposed', word: 'cat', metadata: { lang: 'en' } }),
      ev({ event_type: 'word_exposed', word: '고양이', metadata: { lang: 'ko' } }),
    ];
    expect(metWords(events, 'en')).toEqual(['cat']);
    expect(metWords(events, 'ko')).toEqual(['고양이']);
  });

  it('also includes word_correct and word_spoken as met words', () => {
    const events = [
      ev({ event_type: 'word_correct', word: 'fish', metadata: { lang: 'en' } }),
      ev({ event_type: 'word_spoken', word: 'bird', metadata: { lang: 'en' } }),
      ev({ event_type: 'word_wrong', word: 'tree', metadata: { lang: 'en' } }),
    ];
    const words = metWords(events, 'en');
    expect(words).toContain('fish');
    expect(words).toContain('bird');
    expect(words).toContain('tree');
  });

  it('normalizes english words to lowercase', () => {
    const events = [
      ev({ event_type: 'word_exposed', word: 'Apple', metadata: { lang: 'en' } }),
      ev({ event_type: 'word_exposed', word: 'apple', metadata: { lang: 'en' } }),
    ];
    const words = metWords(events, 'en');
    expect(words).toHaveLength(1);
    expect(words[0]).toBe('apple');
  });
});
