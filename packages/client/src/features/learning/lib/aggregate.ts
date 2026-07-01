import {
  canonicalizeArtStyle,
  type Lang,
  type LearningEvent,
  type LearningEventType,
} from '@tangobook/shared';
import type { MasteryStats } from './mastery';

// ── Reading-time estimation constants ──────────────────────────────────────
/** Max ms gap between page_read events in the same session (5 minutes) */
const SESSION_GAP = 300_000;
/** Cap per page-to-page gap contribution (2 minutes) */
const PAGE_CAP = 120_000;
/** Minimum session floor so a single-page session is not 0 (30 seconds) */
const SESSION_FLOOR = 30_000;

const WORD_TYPES = new Set<LearningEventType>([
  'word_exposed',
  'word_correct',
  'word_wrong',
  'word_spoken',
]);

const SYLLABLE_TYPES = new Set<LearningEventType>(['syllable_correct', 'syllable_wrong']);
const PHONEME_TYPES = new Set<LearningEventType>(['phoneme_correct', 'phoneme_wrong']);

function emptyStats(): MasteryStats {
  return { exposed: 0, correct: 0, wrong: 0, lastAt: null };
}

function bump(stats: MasteryStats, event: LearningEvent) {
  const t = event.event_type;
  if (t === 'word_exposed') {
    stats.exposed += 1;
  } else if (
    t === 'word_correct' ||
    t === 'word_spoken' ||
    t === 'syllable_correct' ||
    t === 'phoneme_correct'
  ) {
    stats.correct += 1;
    stats.exposed += 1;
  } else if (t === 'word_wrong' || t === 'syllable_wrong' || t === 'phoneme_wrong') {
    stats.wrong += 1;
    stats.exposed += 1;
  }
  if (!stats.lastAt || event.created_at > stats.lastAt) stats.lastAt = event.created_at;
}

export function groupByWord(events: LearningEvent[], lang: Lang): Map<string, MasteryStats> {
  const out = new Map<string, MasteryStats>();
  for (const e of events) {
    if (!e.word) continue;
    if (!WORD_TYPES.has(e.event_type)) continue;
    if (e.metadata?.lang && e.metadata.lang !== lang) continue;
    // 영어 단어는 대소문자 정규화 (Apple ≡ apple). 한글은 toLowerCase no-op.
    const key = lang === 'en' ? e.word.toLowerCase() : e.word;
    const cur = out.get(key) ?? emptyStats();
    bump(cur, e);
    out.set(key, cur);
  }
  return out;
}

export function groupBySyllable(events: LearningEvent[]): Map<string, MasteryStats> {
  const out = new Map<string, MasteryStats>();
  for (const e of events) {
    if (!SYLLABLE_TYPES.has(e.event_type)) continue;
    const c = e.metadata?.consonant;
    const v = e.metadata?.vowel;
    if (!c || !v) continue;
    const key = `${c}${v}`;
    const cur = out.get(key) ?? emptyStats();
    bump(cur, e);
    out.set(key, cur);
  }
  return out;
}

export function groupByPhoneme(events: LearningEvent[]): Map<string, MasteryStats> {
  const out = new Map<string, MasteryStats>();
  for (const e of events) {
    if (!PHONEME_TYPES.has(e.event_type)) continue;
    const p = e.metadata?.phoneme;
    if (!p) continue;
    const cur = out.get(p) ?? emptyStats();
    bump(cur, e);
    out.set(p, cur);
  }
  return out;
}

export function countDistinctBooks(events: LearningEvent[], lang: Lang): number {
  const ids = new Set<string>();
  for (const e of events) {
    if (e.event_type !== 'page_read') continue;
    if (e.metadata?.lang && e.metadata.lang !== lang) continue;
    if (e.storybook_id) ids.add(e.storybook_id);
  }
  return ids.size;
}

export interface ArtStyleStat {
  style: string; // ART_STYLES.id (or raw artStyle string fallback)
  pageReads: number;
  distinctBooks: number;
}

const stripVariantSuffix = (id: string): string => id.replace(/__L[1-4]$/, '');

/**
 * page_read 이벤트를 그림체별로 집계.
 * - metadata.style 우선 (Viewer 에서 v2Style/urlStyle/artStyle 폴백 체인으로 로깅)
 * - metadata.style 이 없으면 (구 이벤트) storybooks lookup 으로 base artStyle 폴백
 *   - lookup: 직접 ID → variant suffix 제거 후 base ID
 */
export function groupByArtStyle(
  events: LearningEvent[],
  storybooksById: Map<string, { artStyle?: string }>,
  lang?: Lang
): Map<string, ArtStyleStat> {
  const styleToBooks = new Map<string, Set<string>>();
  const styleToReads = new Map<string, number>();

  const lookup = (id: string): string | undefined => {
    return storybooksById.get(id)?.artStyle ?? storybooksById.get(stripVariantSuffix(id))?.artStyle;
  };

  for (const e of events) {
    if (e.event_type !== 'page_read') continue;
    if (lang && e.metadata?.lang && e.metadata.lang !== lang) continue;

    const fallbackStyle = e.storybook_id ? lookup(e.storybook_id) : undefined;
    // 그림체 정보가 없으면 'unknown' 으로 버킷
    const rawStyle = e.metadata?.style ?? fallbackStyle ?? 'unknown';
    // canonical id 로 정규화 — id 와 prompt 가 섞여 들어와도 같은 버킷으로 합침
    const style = rawStyle === 'unknown' ? 'unknown' : canonicalizeArtStyle(rawStyle);

    styleToReads.set(style, (styleToReads.get(style) ?? 0) + 1);
    if (e.storybook_id) {
      const set = styleToBooks.get(style) ?? new Set<string>();
      set.add(stripVariantSuffix(e.storybook_id));
      styleToBooks.set(style, set);
    }
  }

  const out = new Map<string, ArtStyleStat>();
  for (const [style, reads] of styleToReads.entries()) {
    out.set(style, {
      style,
      pageReads: reads,
      distinctBooks: styleToBooks.get(style)?.size ?? 0,
    });
  }
  return out;
}

// ── New aggregate helpers ──────────────────────────────────────────────────

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

/**
 * Count distinct books read in the last 7 days (KST window anchored at `now`).
 * Reuses `countDistinctBooks` on the date-filtered event slice.
 * `lang` defaults to 'ko' when omitted.
 */
export function booksThisWeek(events: LearningEvent[], now: Date, lang: Lang = 'ko'): number {
  const cutoff = now.getTime() - 7 * 86_400_000;
  const filtered = events.filter((e) => Date.parse(e.created_at) >= cutoff);
  return countDistinctBooks(filtered, lang);
}

/**
 * Return the list of distinct words the learner has encountered.
 * Reuses `groupByWord` which handles lang filtering and en lowercase normalization.
 * Includes words from word_exposed, word_correct, word_wrong, word_spoken events.
 */
export function metWords(events: LearningEvent[], lang: Lang): string[] {
  const map = groupByWord(events, lang);
  return Array.from(map.keys());
}
