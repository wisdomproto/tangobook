import {
  canonicalizeArtStyle,
  kstDateKey,
  completedBooks,
  estimateReadingMinutes,
  computeStreak,
  weekActivity,
  decomposeWord,
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

/**
 * 모음 하나 단위 집계 — **자음×모음 표가 없는 레벨**(한글4 복잡한 모음)용.
 * 🔴 그 레벨의 활동은 모음 듣기·쓰기라 (자음, 모음) 짝이 아예 안 나온다. 표를 억지로 만들면
 *    영영 안 채워질 회색 칸만 남으므로, 실제로 하는 단위인 **모음**으로 센다.
 */
export function groupByVowel(events: LearningEvent[]): Map<string, MasteryStats> {
  const out = new Map<string, MasteryStats>();
  for (const e of events) {
    if (!SYLLABLE_TYPES.has(e.event_type)) continue;
    const v = e.metadata?.vowel;
    if (!v) continue;
    const cur = out.get(v) ?? emptyStats();
    bump(cur, e);
    out.set(v, cur);
  }
  return out;
}

/**
 * 자음×모음 칸 집계 — **음절 활동 + 단어에서 만난 음절**.
 *
 * 🔴 단어를 공부하면 그 단어의 음절도 눈에 들어온다. `고기` 를 하면 `고`·`기` 칸이 그날
 *    노출된 것인데, 예전엔 음절 활동만 세서 **표가 실제보다 비어 보였다**(사용자 지적).
 * 🔴 맞고 틀린 것도 **약하게** 센다(`WORD_CREDIT` = **단어 4번이 글자 1번**). `고기` 를 맞혔다고
 *    `고` 를 읽는다는 확증은 아니지만, 아예 0점을 주면 그게 더 이상하다 — 단어를 맞히는 아이는
 *    그 글자를 어느 정도 읽고 있다. 단어만으로 「연습 중」까지는 2~3번, 「익힘」까지는 열 번쯤
 *    걸리고, 그 사이 그 글자를 따로 한 번 맞히면 단숨에 올라간다.
 */
const WORD_CREDIT = 0.25;
export function groupBySyllable(events: LearningEvent[]): Map<string, MasteryStats> {
  const out = new Map<string, MasteryStats>();
  const cell = (key: string) => {
    const cur = out.get(key) ?? emptyStats();
    out.set(key, cur);
    return cur;
  };
  for (const e of events) {
    if (SYLLABLE_TYPES.has(e.event_type)) {
      const c = e.metadata?.consonant;
      const v = e.metadata?.vowel;
      if (!c || !v) continue;
      bump(cell(`${c}${v}`), e);
    } else if (WORD_TYPES.has(e.event_type) && e.word) {
      // 한글이 아니면 decomposeWord 가 빈 배열이라 영어 단어는 저절로 걸러진다.
      for (const s of decomposeWord(e.word)) {
        const cur = cell(`${s.cho}${s.jung}`);
        cur.exposed += 1;
        if (e.event_type === 'word_correct' || e.event_type === 'word_spoken') {
          cur.correct += WORD_CREDIT;
        } else if (e.event_type === 'word_wrong') {
          cur.wrong += WORD_CREDIT;
        }
        if (!cur.lastAt || e.created_at > cur.lastAt) cur.lastAt = e.created_at;
      }
    }
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

// ── 단어별 상세 (어느 책 · 읽음 · 게임) ────────────────────────────────────────

const HANGUL_RE = /[가-힣ㄱ-ㅎㅏ-ㅣ]/;
const LATIN_RE = /[A-Za-z]/;

/**
 * 단어 자체의 문자로 언어 판별 — 이벤트 `metadata.lang` 은 누락이 잦아
 * (한글 탭에 영어 단어가 섞이는 원인) 신뢰할 수 없다. 한글자 있으면 ko, 라틴 있으면 en.
 */
export function wordScriptLang(word: string): Lang | null {
  if (HANGUL_RE.test(word)) return 'ko';
  if (LATIN_RE.test(word)) return 'en';
  return null;
}

export interface WordDetailBook {
  /** base storybook id (variant suffix 제거) */
  id: string;
  /** 이 책에서 이 단어를 만난 가장 최근 시각 */
  lastAt: string;
}

export interface WordDetail {
  word: string;
  /** 이 단어를 만난 책들 (최근 순) */
  books: WordDetailBook[];
  /** 동화책을 읽다가 만남 (word_exposed) */
  read: boolean;
  /** 게임에서 다룸 (word_correct/word_wrong/word_spoken) */
  played: boolean;
  correct: number;
  wrong: number;
  lastAt: string | null;
}

/**
 * 학습한 단어 전체를 단어별로 묶어 "어느 책 · 읽었는지 · 게임했는지" 까지 반환 (최근 순).
 * 🔴 언어 분류는 `metadata.lang` 이 아니라 **단어의 문자(스크립트)** 기준 — 한/영 섞임 방지.
 */
export function wordDetails(events: LearningEvent[], lang: Lang): WordDetail[] {
  interface Acc {
    word: string;
    books: Map<string, string>; // baseId → lastAt
    read: boolean;
    played: boolean;
    correct: number;
    wrong: number;
    lastAt: string | null;
  }
  const map = new Map<string, Acc>();
  for (const e of events) {
    if (!e.word) continue;
    if (!WORD_TYPES.has(e.event_type)) continue;
    if (wordScriptLang(e.word) !== lang) continue;
    const key = lang === 'en' ? e.word.toLowerCase() : e.word;
    let cur = map.get(key);
    if (!cur) {
      cur = {
        word: key,
        books: new Map(),
        read: false,
        played: false,
        correct: 0,
        wrong: 0,
        lastAt: null,
      };
      map.set(key, cur);
    }
    if (e.event_type === 'word_exposed') cur.read = true;
    else if (e.event_type === 'word_correct' || e.event_type === 'word_spoken') {
      cur.played = true;
      cur.correct += 1;
    } else if (e.event_type === 'word_wrong') {
      cur.played = true;
      cur.wrong += 1;
    }
    if (e.storybook_id) {
      const base = stripVariantSuffix(e.storybook_id);
      const prev = cur.books.get(base);
      if (!prev || e.created_at > prev) cur.books.set(base, e.created_at);
    }
    if (!cur.lastAt || e.created_at > cur.lastAt) cur.lastAt = e.created_at;
  }
  return Array.from(map.values())
    .map((v) => ({
      word: v.word,
      books: Array.from(v.books.entries())
        .map(([id, lastAt]) => ({ id, lastAt }))
        .sort((a, b) => (a.lastAt > b.lastAt ? -1 : 1)),
      read: v.read,
      played: v.played,
      correct: v.correct,
      wrong: v.wrong,
      lastAt: v.lastAt,
    }))
    .sort((a, b) => ((a.lastAt ?? '') > (b.lastAt ?? '') ? -1 : 1));
}

// ── 그림체 장르 집계 (수채동화풍/페이퍼 3D 아트/콜라주) ────────────────────────

export interface GenreStat {
  genre: string; // 표시명 (STYLE_GENRES.label)
  pageReads: number;
  distinctBooks: number;
}

/**
 * page_read 를 **학습자 장르**(3종)로 집계 — 원시 스타일 id 는 컴포넌트가 넘긴
 * `resolveGenre` 로 장르명(또는 null=3종 아님)으로 변환한다. null 은 제외.
 */
export function groupByGenre(
  events: LearningEvent[],
  storybooksById: Map<string, { artStyle?: string }>,
  resolveGenre: (rawStyle: string) => string | null,
  lang?: Lang
): GenreStat[] {
  const toBooks = new Map<string, Set<string>>();
  const toReads = new Map<string, number>();
  const lookup = (id: string): string | undefined =>
    storybooksById.get(id)?.artStyle ?? storybooksById.get(stripVariantSuffix(id))?.artStyle;

  for (const e of events) {
    if (e.event_type !== 'page_read') continue;
    if (lang && e.metadata?.lang && e.metadata.lang !== lang) continue;
    const raw = e.metadata?.style ?? (e.storybook_id ? lookup(e.storybook_id) : undefined);
    if (!raw) continue;
    const genre = resolveGenre(raw);
    if (!genre) continue;
    toReads.set(genre, (toReads.get(genre) ?? 0) + 1);
    if (e.storybook_id) {
      const set = toBooks.get(genre) ?? new Set<string>();
      set.add(stripVariantSuffix(e.storybook_id));
      toBooks.set(genre, set);
    }
  }

  return Array.from(toReads.entries())
    .map(([genre, pageReads]) => ({
      genre,
      pageReads,
      distinctBooks: toBooks.get(genre)?.size ?? 0,
    }))
    .sort((a, b) => b.pageReads - a.pageReads);
}
