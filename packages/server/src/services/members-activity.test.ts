import { describe, it, expect } from 'vitest';
import { summarizeChildActivity, countGameSessions } from './members-activity.js';
import type { LearningEvent } from '@tangobook/shared';

const ev = (over: Partial<LearningEvent>): LearningEvent => ({
  id: 'e',
  profile_id: 'p1',
  event_type: 'page_read',
  storybook_id: 'b1',
  game_type: null,
  word: null,
  metadata: null,
  created_at: '2026-07-08T10:00:00Z',
  ...over,
});
const NOW = new Date('2026-07-09T00:00:00Z');

describe('countGameSessions', () => {
  it('같은 게임·같은 KST 날짜 이벤트 여러 개 = 세션 1', () => {
    const events = [
      ev({
        game_type: 'korean-block',
        event_type: 'word_correct',
        created_at: '2026-07-08T10:00:00Z',
      }),
      ev({
        game_type: 'korean-block',
        event_type: 'word_correct',
        created_at: '2026-07-08T10:01:00Z',
      }),
      ev({
        game_type: 'korean-block',
        event_type: 'word_correct',
        created_at: '2026-07-07T09:00:00Z',
      }),
      ev({
        game_type: 'connect-the-dots',
        event_type: 'word_correct',
        created_at: '2026-07-08T10:00:00Z',
      }),
      ev({ game_type: null }),
    ];
    expect(countGameSessions(events)).toBe(3);
  });
});

describe('summarizeChildActivity', () => {
  it('완독·만난단어·마지막활동을 집계한다', () => {
    const events = [
      ev({ metadata: { lastPage: true, totalPages: 10 } }),
      ev({ event_type: 'word_exposed', word: '사과', created_at: '2026-07-08T11:00:00Z' }),
      ev({ event_type: 'word_exposed', word: '사과', created_at: '2026-07-08T11:01:00Z' }),
    ];
    const s = summarizeChildActivity(events, NOW);
    expect(s.completedBooks).toBe(1);
    expect(s.wordsMet).toBe(1);
    expect(s.lastActiveAt).toBe('2026-07-08T11:01:00Z');
    expect(s.week).toHaveLength(7);
    expect(s.readingMinutes).toBeGreaterThanOrEqual(1);
  });
  it('이벤트 없음 → 전부 0/null', () => {
    const s = summarizeChildActivity([], NOW);
    expect(s).toMatchObject({
      completedBooks: 0,
      wordsMet: 0,
      lastActiveAt: null,
      readingMinutes: 0,
      streak: 0,
      gameSessions: 0,
    });
  });
});
