// 학습 이벤트 집계 공식 — 부모 리포트(클라)와 운영 대시보드(서버)가 공유.
// 🔴 여기 수치 공식을 바꾸면 두 화면이 함께 바뀐다. 클라 전용 집계는
// packages/client/src/features/learning/lib/aggregate.ts 에 그대로 있음.
import type { LearningEvent } from '../types/learning-events.js';

const SESSION_GAP = 300_000;
const PAGE_CAP = 120_000;
const SESSION_FLOOR = 30_000;

/**
 * Convert a UTC ISO string to a KST date key (YYYY-MM-DD).
 * Korea is always UTC+9; no DST.
 */
export function kstDateKey(iso: string): string {
  const kstMs = Date.parse(iso) + 9 * 3_600_000;
  return new Date(kstMs).toISOString().slice(0, 10);
}

export interface CompletedBookStat {
  storybookId: string;
  /** Number of times the last page was reached (across all sessions) */
  count: number;
  /** ISO string of the most recent completion */
  lastAt: string;
}

/**
 * Returns per-book completion stats.
 * A "completion" = page_read event where metadata.lastPage === true AND metadata.totalPages > 0.
 * Same book read to the end in N sessions → count N.
 */
export function completedBooks(events: LearningEvent[]): CompletedBookStat[] {
  const byBook = new Map<string, CompletedBookStat>();
  for (const e of events) {
    if (e.event_type !== 'page_read') continue;
    if (!e.storybook_id) continue;
    if (e.metadata?.lastPage !== true) continue;
    if (!e.metadata.totalPages || e.metadata.totalPages <= 0) continue;

    const cur = byBook.get(e.storybook_id);
    if (!cur) {
      byBook.set(e.storybook_id, {
        storybookId: e.storybook_id,
        count: 1,
        lastAt: e.created_at,
      });
    } else {
      cur.count += 1;
      if (e.created_at > cur.lastAt) cur.lastAt = e.created_at;
    }
  }
  return Array.from(byBook.values());
}

/**
 * Estimate total reading time in minutes from page_read events.
 *
 * Algorithm:
 * - Sort events by created_at.
 * - Adjacent gap ≤ SESSION_GAP (5 min) → same session; sum gap capped at PAGE_CAP (2 min).
 * - Each session gets a minimum of SESSION_FLOOR (30 s) so single-page sessions ≠ 0.
 * - Returns total minutes rounded; Math.max(1, rounded) only when ≥1 event, else 0.
 */
export function estimateReadingMinutes(events: LearningEvent[], _now?: Date): number {
  const pageReads = events
    .filter((e) => e.event_type === 'page_read')
    .map((e) => Date.parse(e.created_at))
    .sort((a, b) => a - b);

  if (pageReads.length === 0) return 0;

  let totalMs = 0;
  let sessionMs = 0;

  for (let i = 1; i < pageReads.length; i++) {
    const gap = pageReads[i] - pageReads[i - 1];
    if (gap <= SESSION_GAP) {
      // Same session — contribute gap capped at PAGE_CAP
      sessionMs += Math.min(gap, PAGE_CAP);
    } else {
      // New session — flush previous with floor applied
      totalMs += Math.max(sessionMs, SESSION_FLOOR);
      sessionMs = 0;
    }
  }
  // Flush the last (or only) session
  totalMs += Math.max(sessionMs, SESSION_FLOOR);

  const minutes = Math.round(totalMs / 60_000);
  return Math.max(1, minutes);
}

/**
 * Compute the current reading streak in days (counting back from `now` in KST).
 * - Finds distinct KST dates with any learning event.
 * - Counts consecutive days ending today or yesterday KST.
 * - A gap ≥ 2 days breaks the streak.
 */
export function computeStreak(events: LearningEvent[], now: Date): number {
  if (events.length === 0) return 0;

  const todayKst = kstDateKey(now.toISOString());

  // Collect distinct KST date keys
  const dates = new Set<string>(events.map((e) => kstDateKey(e.created_at)));

  // Walk back day by day starting from today
  let streak = 0;
  let cursor = new Date(Date.parse(todayKst + 'T00:00:00Z')); // midnight UTC for that KST date

  // If neither today nor yesterday has an event, streak = 0
  const todayMs = cursor.getTime();
  const yesterdayKey = new Date(todayMs - 86_400_000).toISOString().slice(0, 10);
  if (!dates.has(todayKst) && !dates.has(yesterdayKey)) return 0;

  // Start from today if it has an event, otherwise from yesterday
  if (!dates.has(todayKst)) {
    cursor = new Date(todayMs - 86_400_000);
  }

  while (dates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - 86_400_000);
  }

  return streak;
}

export interface WeekDay {
  /** KST date key (YYYY-MM-DD) */
  key: string;
  /** 요일 라벨 (일~토) */
  label: string;
  /** 그 날 학습 이벤트가 있었는지 */
  active: boolean;
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

/** 최근 7일(KST, 오늘 포함)의 읽기 리듬 — 오래된 날 → 오늘 순. WeekDotsRow 용. */
export function weekActivity(events: LearningEvent[], now: Date): WeekDay[] {
  const dates = new Set(events.map((e) => kstDateKey(e.created_at)));
  const todayMs = Date.parse(kstDateKey(now.toISOString()) + 'T00:00:00Z');
  const out: WeekDay[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(todayMs - i * 86_400_000);
    const key = d.toISOString().slice(0, 10);
    out.push({ key, label: DAY_LABELS[d.getUTCDay()], active: dates.has(key) });
  }
  return out;
}
