import type { Lang, LearningEvent, LearningEventType } from '@tangobook/shared';
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
    // 그림체 정보가 없으면 'unknown' 으로 버킷 (예전 이벤트 + 매칭 실패 시에도 활동량은 표시)
    const style = e.metadata?.style ?? fallbackStyle ?? 'unknown';

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
