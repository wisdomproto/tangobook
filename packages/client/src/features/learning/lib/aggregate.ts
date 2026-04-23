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
    const cur = out.get(e.word) ?? emptyStats();
    bump(cur, e);
    out.set(e.word, cur);
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
