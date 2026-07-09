import type { LearningEvent, WeekDay } from '@tangobook/shared';
import {
  completedBooks,
  computeStreak,
  estimateReadingMinutes,
  kstDateKey,
  weekActivity,
} from '@tangobook/shared';

/** 게임 세션 수 = (game_type, KST 날짜) distinct — 한 판이 단어별 이벤트 여러 개를 남기므로 raw count 아님(스펙). */
export function countGameSessions(events: LearningEvent[]): number {
  const keys = new Set<string>();
  for (const e of events) {
    if (!e.game_type) continue;
    keys.add(`${e.game_type}|${kstDateKey(e.created_at)}`);
  }
  return keys.size;
}

export interface ChildActivitySummary {
  lastActiveAt: string | null;
  completedBooks: number;
  readingMinutes: number;
  streak: number;
  week: WeekDay[];
  wordsMet: number;
  gameSessions: number;
}

/** 자녀 1명 이벤트 → 활동 요약. shared 공식 재사용으로 부모 리포트와 수치 일치. */
export function summarizeChildActivity(events: LearningEvent[], now: Date): ChildActivitySummary {
  let lastActiveAt: string | null = null;
  const words = new Set<string>();
  for (const e of events) {
    if (!lastActiveAt || e.created_at > lastActiveAt) lastActiveAt = e.created_at;
    if (e.event_type === 'word_exposed' && e.word) words.add(e.word);
  }
  return {
    lastActiveAt,
    completedBooks: completedBooks(events).length,
    readingMinutes: events.length > 0 ? estimateReadingMinutes(events) : 0,
    streak: computeStreak(events, now),
    week: weekActivity(events, now),
    wordsMet: words.size,
    gameSessions: countGameSessions(events),
  };
}
