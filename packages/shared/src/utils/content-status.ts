// 콘텐츠 현황 집계 — 🔴 이 계산의 **유일한 사본**이다.
//
// 쓰는 곳이 셋이라 여기 한 곳에만 둔다:
//   1. 서버 `GET /api/content-status`      — 라이브(R2 직접), 저작도구가 본다
//   2. `scripts/build-content-status.mjs`  — 정적 파일로 구워 두는 용도
//   3. `scripts/audit-reading-levels.mjs`  — 난이도 감사표
//
// 🔴 복사해서 쓰지 마라. 오늘(2026-09-04) 같은 값이 세 개(129/83 · 126/72 · 128/86)가 됐던 게
//    전부 「각자 세어서」 생긴 일이다.

/* 입력은 R2 원본이라 필드가 들쭉날쭉하다(snake_case 혼용·옛 책 누락). 여기서 읽는 것만 좁게 적는다. */
interface KeyObjectLike {
  korean?: string;
  name?: string;
  nameEn?: string;
  keypoints?: unknown[];
}
interface PageLike {
  text?: string;
  illustrationUrl?: string;
  ttsUrl?: string;
}
interface FlashcardLike {
  imageUrl?: string;
  keypoints?: unknown[];
}
export interface BookLike {
  id: string;
  title?: string;
  category?: string;
  folder?: string;
  isPublic?: boolean;
  type?: string;
  readingLevel?: string;
  languages?: unknown[];
  styleAssets?: Record<string, unknown>;
  pages?: PageLike[];
  key_objects?: KeyObjectLike[];
  keyObjects?: KeyObjectLike[];
  keyObjectImages?: KeyObjectLike[];
  flashcards?: FlashcardLike[];
  phonicsConfig?: { targetWords?: string[] };
  coverImage?: string;
  games?: unknown;
  hiddenObjectScenes?: unknown;
  chant?: unknown;
  longformProjects?: unknown;
  audiobookProjects?: unknown;
  blogPosts?: unknown;
  cardNewsProjects?: unknown;
  theme?: unknown;
  setting?: unknown;
  characters?: unknown;
}
interface TrackAgg {
  track: string;
  units: number;
  words: number;
  other: number;
  own: number;
  covered: number;
}
interface CategoryAgg {
  category: string;
  books: number;
  public: number;
  words: number;
  withWords: number;
  withGames: number;
  withHidden: number;
  actual: Record<string, number>;
  levelMissing: number;
  levelWrong: number;
}

/* ────────────────────────────── 독서 레벨 ────────────────────────────── */
//   L1 씨앗 3~4세 · 1문장/쪽 · 총 ≤50낱말 · 반복 구문
//   L2 새싹 4~6세 · 1~4문장/쪽 · 총 80~350낱말
//   L3 나무 6~7세 · 3~5문장/쪽 · 총 400~700낱말
// 낱말 = 한국어 **어절**(공백 분리). 경계값(60·380)이 타입 정의보다 느슨한 건 실물이 딱 안 떨어져서다.

export const LEVELS = ['L1', 'L2', 'L3'] as const;
export type Level = (typeof LEVELS)[number];

export interface Measured {
  words: number;
  textPages: number;
  sentPerPage: number;
}

/** 총 어절 수와 쪽당 문장 수로 레벨을 매긴다. 낱말 수를 먼저 본다(문장 수는 보조). */
export function classify(words: number, sentPerPage: number): Level | null {
  if (words === 0) return null;
  if (words <= 60 && sentPerPage <= 1.6) return 'L1';
  if (words <= 380) return 'L2';
  return 'L3';
}

/** 본문 쪽에서 어절·문장·글 있는 쪽수를 잰다. */
export function measure(sb: { pages?: PageLike[] }): Measured {
  const pages = Array.isArray(sb.pages) ? sb.pages : [];
  let words = 0;
  let sentences = 0;
  let textPages = 0;
  for (const p of pages) {
    const t = p && typeof p.text === 'string' ? p.text.trim() : '';
    if (!t) continue;
    textPages++;
    words += t.split(/\s+/).filter(Boolean).length;
    const marks = (t.match(/[.!?…]|[。！？]/g) || []).length;
    sentences += Math.max(1, marks);
  }
  return { words, textPages, sentPerPage: textPages ? sentences / textPages : 0 };
}

/* ────────────────────────────── 낱말 정규화 ────────────────────────────── */

/** 🔴 낱말 비교는 여기 한 곳에서만 정규화한다 — 두 벌이 되면 연결률이 두 개가 된다. */
export const normWord = (w: unknown): string =>
  String(w ?? '')
    .trim()
    .toLowerCase();

/**
 * 한 책이 다루는 낱말의 **모든 표기**.
 * 🔴 `korean || name || nameEn` 로 하나만 고르면 안 된다 — 영어 책은 `korean` 이 한국어 번역이라
 *    영어 타겟 낱말과 영영 안 맞는다. 그래서 영어 이음매가 33%로 잘못 나왔었다(실제 98%).
 *    폴백이 「빈 값」이 아니라 「틀린 값」이면 `||` 로는 안 걸린다.
 */
export function bookWordForms(sb: BookLike): string[] {
  const ko = sb?.key_objects ?? sb?.keyObjects ?? [];
  const out: string[] = [];
  for (const k of ko)
    for (const w of [k?.korean, k?.name, k?.nameEn]) if (normWord(w)) out.push(String(w));
  return out;
}

/* ────────────────────────────── 이음매 ────────────────────────────── */

export interface SeamUnit {
  id: string;
  title: string;
  track: string;
  words: number;
  other: number;
  own: number;
  covered: number;
  missing: string[];
  rawWords: string[];
  displayWords: string[];
}

/**
 * 이음매 — 파닉스 단원의 타겟 낱말에 예문(동화책 쪽)이 붙나.
 *
 * 🔴 **`covered` 가 그 숫자다.** 한글 나무/ABC 나무도 동화책이다(사용자, 2026-09-04) —
 *    메인 라인업 밖(`type:'phonics'` 안의 8쪽)이라고 빼면 없는 구멍이 생긴다.
 *    실제로 그렇게 세서 한글을 67%로 잘못 보고했다(맞는 값 98%).
 *
 *    other/own 은 **어디서 나왔나**의 내역일 뿐 등급이 아니다. `SceneReveal` 이 ①다른 동화책 →
 *    ②그 단원 나무 동화 순으로 고르는 건 다양성 때문이지 ②가 책이 아니라서가 아니다.
 *
 * 🔴 본문 텍스트로 매칭하지 않는다 — 「나」가 「나무」에 걸린다. key_objects 는 큐레이션된 목록이라 안전하다.
 */
export function computeSeam(
  units: { id: string; title?: string; targetWords?: string[]; ownWords?: string[] }[],
  otherBookWords: Set<string>
) {
  const rows: SeamUnit[] = units
    .map((r) => {
      const display = (r.targetWords ?? []).filter((w) => normWord(w));
      const words = display.map(normWord);
      const own = new Set((r.ownWords ?? []).map(normWord).filter(Boolean));
      const inOther = (w: string) => otherBookWords.has(w);
      const inOwn = (w: string) => own.has(w);
      return {
        id: r.id,
        title: r.title ?? '',
        track: String(r.id ?? '').split('-')[0] || '?',
        rawWords: words,
        displayWords: display,
        words: words.length,
        other: words.filter(inOther).length,
        own: words.filter(inOwn).length,
        covered: words.filter((w) => inOther(w) || inOwn(w)).length,
        missing: display.filter((w) => !inOther(normWord(w)) && !inOwn(normWord(w))),
      };
    })
    // 🔴 id 가 곧 커리큘럼 순서다 (kr-h1-u01 … kr-h4-u05) — 사전순 정렬이 진도순이다.
    .sort((a, b) => String(a.id).localeCompare(String(b.id)));

  const byTrack: Record<string, TrackAgg> = {};
  for (const u of rows) {
    const t = (byTrack[u.track] ??= {
      track: u.track,
      units: 0,
      words: 0,
      other: 0,
      own: 0,
      covered: 0,
    });
    t.units += 1;
    for (const k of ['words', 'other', 'own', 'covered'] as const) t[k] += u[k];
  }
  const sum = (k: 'words' | 'other' | 'own' | 'covered') => rows.reduce((a, u) => a + u[k], 0);
  return {
    units: rows,
    byTrack: Object.values(byTrack),
    words: sum('words'),
    other: sum('other'),
    own: sum('own'),
    covered: sum('covered'),
  };
}

/* ────────────────────────────── 전체 집계 ────────────────────────────── */

export const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);

const num = (v: unknown) => (Array.isArray(v) ? v.length : v ? 1 : 0);

/** 한 권에서 「있나 없나」를 뽑는다. 축 이름이 곧 화면의 열이다. */
export function probeBook(sb: BookLike) {
  const pages = sb.pages ?? [];
  const ko = sb.key_objects ?? sb.keyObjects ?? [];
  const koi = sb.keyObjectImages ?? [];
  const fc = sb.flashcards ?? [];
  const pc = sb.phonicsConfig ?? {};
  const isPhonics = sb.type === 'phonics';
  const mz = measure(sb);

  return {
    id: sb.id,
    title: sb.title ?? '',
    category: sb.category || sb.folder || '(없음)',
    isPublic: !!sb.isPublic,
    isPhonics,
    langs: (sb.languages ?? []).length,
    styles: Object.keys(sb.styleAssets ?? {}).length,

    pages: pages.length,
    illust: pages.filter((p) => p.illustrationUrl).length,
    tts: pages.filter((p) => p.ttsUrl).length,
    cover: sb.coverImage ? 1 : 0,
    // 마스터 문서가 표지를 그린다 — URL 문자열 하나라 rows 크기엔 거의 영향이 없다.
    coverImage: sb.coverImage || null,
    words: isPhonics ? (pc.targetWords ?? []).length : ko.length,
    cards: isPhonics ? fc.filter((f) => f.imageUrl).length : koi.length,
    keypoints: isPhonics
      ? fc.filter((f) => (f.keypoints ?? []).length).length
      : koi.filter((k) => (k?.keypoints ?? []).length).length,
    games: num(sb.games),
    hidden: num(sb.hiddenObjectScenes),
    chant: sb.chant ? 1 : 0,

    levelDeclared: sb.readingLevel || null,
    levelActual: isPhonics ? null : classify(mz.words, mz.sentPerPage),
    textWords: mz.words,

    longform: num(sb.longformProjects),
    audiobook: num(sb.audiobookProjects),
    blog: num(sb.blogPosts),
    cardnews: num(sb.cardNewsProjects),
    theme: sb.theme ? 1 : 0,
    setting: sb.setting ? 1 : 0,
    cast: num(sb.characters),

    targetWords: isPhonics ? (pc.targetWords ?? []) : undefined,
    ownWords: isPhonics ? bookWordForms(sb) : undefined,
  };
}

const median = (a: number[]) => {
  const s = a.filter((n) => n > 0).sort((x, y) => x - y);
  return s.length ? s[Math.floor(s.length / 2)] : 0;
};

/** 책 전부를 받아 현황판·그래프가 쓰는 집계를 만든다. */
export function buildContentStatus(all: BookLike[]) {
  const rows = all.filter(Boolean).map(probeBook);
  const books = rows.filter((r) => !r.isPhonics);
  const phonics = rows.filter((r) => r.isPhonics);

  // 낱말 재출현 — 「같은 낱말이 여러 책에」가 학습 설계의 축이라 여기서 같이 잰다.
  // 🔴 키 규칙을 바꾸면 추적 중인 uniq/multi 가 조용히 움직이므로 이음매용 집합과 따로 만든다.
  const wordBooks = new Map<string, Set<string>>();
  for (const sb of all.filter(Boolean)) {
    if (sb.type === 'phonics') continue;
    for (const k of sb.key_objects ?? sb.keyObjects ?? []) {
      const w = String(k.korean || k.name || '').trim();
      if (!w) continue;
      if (!wordBooks.has(w)) wordBooks.set(w, new Set());
      wordBooks.get(w)!.add(sb.id);
    }
  }
  const uniqueWords = wordBooks.size;
  const multiBookWordPct = uniqueWords
    ? Math.round(([...wordBooks.values()].filter((s) => s.size >= 2).length / uniqueWords) * 100)
    : 0;

  // 이음매 — 「다른 동화책」쪽 집합(파닉스 제외)
  const otherWords = new Set<string>();
  for (const sb of all.filter(Boolean)) {
    if (sb.type === 'phonics') continue;
    for (const w of bookWordForms(sb)) otherWords.add(normWord(w));
  }
  const seam = computeSeam(phonics, otherWords);

  // 낱말 → 어느 책에 나오나 (그래프용, 파닉스 나무 동화 포함)
  const wordToBooks = new Map<string, Set<string>>();
  for (const sb of all.filter(Boolean)) {
    for (const w of bookWordForms(sb)) {
      const n = normWord(w);
      if (!wordToBooks.has(n)) wordToBooks.set(n, new Set());
      wordToBooks.get(n)!.add(sb.id);
    }
  }

  const byId = new Map(rows.map((r) => [r.id, r]));
  const graph: Record<string, unknown> = {};
  for (const t of seam.byTrack as TrackAgg[]) {
    const units = seam.units.filter((u) => u.track === t.track);
    const ids = new Set<string>();
    for (const u of units)
      for (const w of u.rawWords) for (const id of wordToBooks.get(w) ?? []) ids.add(id);
    const gb = [...ids].map((id) => byId.get(id)).filter(Boolean) as NonNullable<
      ReturnType<typeof probeBook>
    >[];
    gb.sort((a, b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title));
    const idx = new Map(gb.map((b, i) => [b.id, i]));
    graph[t.track] = {
      books: gb.map((b) => ({
        id: b.id,
        title: b.title,
        category: b.category,
        isPhonics: b.isPhonics,
        words: b.words,
      })),
      units: units.map((u) => ({
        id: u.id,
        title: u.title,
        words: u.rawWords.map((w, i) => ({
          w: u.displayWords[i] ?? w,
          books: [...(wordToBooks.get(w) ?? [])]
            .map((id) => idx.get(id))
            .filter((n) => n !== undefined),
        })),
      })),
    };
  }

  // 카테고리 롤업
  const byCategory: Record<string, CategoryAgg & { _w: number[] }> = {};
  for (const r of books) {
    const c = (byCategory[r.category] ??= {
      category: r.category,
      books: 0,
      public: 0,
      words: 0,
      withWords: 0,
      withGames: 0,
      withHidden: 0,
      actual: {} as Record<string, number>,
      levelMissing: 0,
      levelWrong: 0,
      _w: [] as number[],
    });
    c.books += 1;
    if (r.isPublic) c.public += 1;
    c.words += r.words;
    if (r.words) c.withWords += 1;
    if (r.games) c.withGames += 1;
    if (r.hidden) c.withHidden += 1;
    const key = r.levelActual ?? '없음';
    c.actual[key] = (c.actual[key] ?? 0) + 1;
    if (!r.levelDeclared) c.levelMissing += 1;
    else if (r.levelActual && r.levelDeclared !== r.levelActual) c.levelWrong += 1;
    c._w.push(r.textWords);
  }
  const categories = Object.values(byCategory)
    .map(({ _w, ...c }) => ({ ...c, wordsMedian: median(_w) }))
    .sort((a, b) => b.public - a.public || b.books - a.books);

  const levels = {
    missing: books.filter((r) => !r.levelDeclared).length,
    wrong: books.filter(
      (r) => r.levelDeclared && r.levelActual && r.levelDeclared !== r.levelActual
    ).length,
    actual: books.reduce((a: Record<string, number>, r) => {
      const k = r.levelActual ?? '없음';
      a[k] = (a[k] ?? 0) + 1;
      return a;
    }, {}),
  };

  return {
    rows,
    books: books.length,
    phonicsUnits: phonics.length,
    public: rows.filter((r) => r.isPublic).length,
    words: rows.reduce((a, r) => a + r.words, 0),
    uniqueWords,
    multiBookWordPct,
    categories,
    levels,
    seam: {
      words: seam.words,
      covered: seam.covered,
      coveredPct: pct(seam.covered, seam.words),
      other: seam.other,
      otherPct: pct(seam.other, seam.words),
      own: seam.own,
      byTrack: (seam.byTrack as TrackAgg[]).map((t) => ({
        ...t,
        coveredPct: pct(t.covered, t.words),
        otherPct: pct(t.other, t.words),
      })),
      units: seam.units.map((u) => {
        // 정규화형/원문은 그래프가 graph 에서 따로 받는다 — 여기 실으면 파일만 커진다.
        const { rawWords: _a, displayWords: _b, ...rest } = u;
        return rest;
      }),
    },
    graph,
  };
}
