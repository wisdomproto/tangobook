import {
  canonicalizeArtStyle,
  kstDateKey,
  completedBooks,
  estimateReadingMinutes,
  computeStreak,
  weekActivity,
  type Lang,
  type LearningEvent,
  type LearningEventType,
} from '@tangobook/shared';
export { kstDateKey, completedBooks, estimateReadingMinutes, computeStreak, weekActivity };
export type { CompletedBookStat, WeekDay } from '@tangobook/shared';
import type { MasteryStats } from './mastery';

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
 * Return the list of distinct words the learner has encountered, most recent first.
 * Reuses `groupByWord` which handles lang filtering and en lowercase normalization.
 * Includes words from word_exposed, word_correct, word_wrong, word_spoken events.
 */
export function metWords(events: LearningEvent[], lang: Lang): string[] {
  const map = groupByWord(events, lang);
  return Array.from(map.entries())
    .sort((a, b) => ((a[1].lastAt ?? '') > (b[1].lastAt ?? '') ? -1 : 1))
    .map(([word]) => word);
}

export interface RecentBookStat {
  storybookId: string;
  /** page_read count for this book (완독 여부 무관) */
  pageReads: number;
  /** ISO string of the most recent page_read */
  lastAt: string;
}

/**
 * page_read 를 책별로 묶어 최근 순 정렬 — 완독하지 않은 책도 표지를 보여주기 위함
 * (리포트의 감정 훅은 표지인데 완독에만 잠그면 저활동 사용자 화면이 텅 빈다).
 */
export function recentBooks(events: LearningEvent[]): RecentBookStat[] {
  const byBook = new Map<string, RecentBookStat>();
  for (const e of events) {
    if (e.event_type !== 'page_read') continue;
    if (!e.storybook_id) continue;
    const cur = byBook.get(e.storybook_id);
    if (!cur) {
      byBook.set(e.storybook_id, {
        storybookId: e.storybook_id,
        pageReads: 1,
        lastAt: e.created_at,
      });
    } else {
      cur.pageReads += 1;
      if (e.created_at > cur.lastAt) cur.lastAt = e.created_at;
    }
  }
  return Array.from(byBook.values()).sort((a, b) => (a.lastAt > b.lastAt ? -1 : 1));
}

/** KST 날짜를 "6월 30일" 형태로 (원시 ISO 노출 방지). */
export function formatKstDate(iso: string): string {
  const key = kstDateKey(iso);
  return `${Number(key.slice(5, 7))}월 ${Number(key.slice(8, 10))}일`;
}
