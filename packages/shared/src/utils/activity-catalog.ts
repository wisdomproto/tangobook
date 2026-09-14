/**
 * 활동 모음(`/activity`) 목록 — 🔴 클라 목록 · 서버 SSR · sitemap · IndexNow 가 **전부 이 파일**로 파생한다
 * (sitemap 과 IndexNow 가 각자 목록을 세다 파닉스 73개가 빠질 뻔했다).
 * 색칠·숨은그림 원천 JSON 은 `build-activity-catalog.mjs` 가 굽는다(`public/activity-data/`).
 */
import { PHONICS_TRACK_META, flattenPhonicsUnits, type PhonicsTrack } from './phonics-units.js';

export type ActivityKind = 'hangul' | 'english' | 'coloring' | 'hidden-object';
export const ACTIVITY_KINDS: ActivityKind[] = ['hangul', 'english', 'coloring', 'hidden-object'];
export const ACTIVITY_KIND_LABEL: Record<ActivityKind, string> = {
  hangul: '한글 워크지',
  english: '영어 워크지',
  coloring: '색칠 도안',
  'hidden-object': '숨은그림찾기',
};

export interface ColoringCatalogEntry {
  key: string;
  group: string;
  section: string;
  word: string;
  language?: 'korean' | 'english';
  /** 파닉스 도안 — 단원 id */
  unitId?: string;
  /** 동화책 도안 — 살아 있는 공개 책 id */
  bookId?: string;
  bookTitle?: string;
  lineartUrl: string;
  originalUrl?: string | null;
  answerUrl?: string | null;
  blurb?: string;
}

export interface HiddenObjectCatalogEntry {
  key: string;
  bookId: string;
  bookTitle: string;
  category: string;
  sceneImageUrl: string;
  words: string[];
  blurb?: string;
}

export interface ActivityItem {
  kind: ActivityKind;
  key: string;
  slug: string;
  title: string;
  group: string;
  section: string;
  path: string;
  sourceHref: string;
  sourceLabel: string;
  image?: string;
  blurb?: string;
}

const KEY_RE: Record<ActivityKind, RegExp> = {
  coloring: /^(ph|bk)-\d{4}(?=$|-)/,
  'hidden-object': /^(ho|jr|nt)-\d{4}(?=$|-)/,
  hangul: /^kr-h\d+-u\d+$/,
  english: /^en-b\d+-u\d+$/,
};

/** `[가-힣a-zA-Z0-9]` 밖은 `-` 하나로, 앞뒤 `-` 제거, 40자. */
export function slugify(text: string): string {
  return text
    .replace(/[^가-힣a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/, '');
}

/** 주소 세그먼트(디코드된 값)에서 키만. 워크지는 세그먼트 전체가 단원 id 여야 한다. */
export function parseActivityKey(kind: ActivityKind, segment: string): string | null {
  const m = segment.match(KEY_RE[kind]);
  return m ? m[0] : null;
}

const slugOf = (key: string, decoration: string) => {
  const d = slugify(decoration);
  return d ? `${key}-${d}` : key;
};

const PHONICS_CTA = '🔤 탱고북 파닉스에서 이어 하기';
const BOOK_CTA = '📖 이 그림이 나오는 동화책 읽기';

export function worksheetItems(kind: 'hangul' | 'english'): ActivityItem[] {
  const track: PhonicsTrack = kind === 'hangul' ? 'korean' : 'english';
  return flattenPhonicsUnits(track).map((u) => ({
    kind,
    key: u.id,
    slug: u.id,
    title: u.name,
    group: u.levelName,
    section: u.levelName,
    path: `/activity/${kind}/${u.id}`,
    sourceHref: `${PHONICS_TRACK_META[track].learnBase}/${u.id}`,
    sourceLabel: PHONICS_CTA,
  }));
}

export function coloringItems(entries: ColoringCatalogEntry[]): ActivityItem[] {
  return entries.map((e) => {
    const slug = slugOf(e.key, e.bookTitle ? `${e.word} ${e.bookTitle}` : e.word);
    // 파닉스 트랙은 unit id 접두어(`kr-`/`en-`)가 정한다 — language 필드가 아니다(레포 규칙).
    const track: PhonicsTrack = e.unitId?.startsWith('en-') ? 'english' : 'korean';
    return {
      kind: 'coloring' as const,
      key: e.key,
      slug,
      title: e.word,
      group: e.group,
      // 동화책 도안은 굽기 때의 공개 책 제목(분할 뒤 이름)을 쓴다 — manifest 의 section 은 옛 이름일 수 있다.
      section: e.bookTitle ?? e.section,
      path: `/activity/coloring/${slug}`,
      sourceHref: e.bookId
        ? `/library/${e.bookId}`
        : e.unitId
          ? `${PHONICS_TRACK_META[track].learnBase}/${e.unitId}`
          : PHONICS_TRACK_META[track].learnBase,
      sourceLabel: e.bookId ? BOOK_CTA : PHONICS_CTA,
      image: e.lineartUrl,
      blurb: e.blurb,
    };
  });
}

export function hiddenObjectItems(entries: HiddenObjectCatalogEntry[]): ActivityItem[] {
  return entries.map((e) => {
    const slug = slugOf(e.key, e.bookTitle);
    return {
      kind: 'hidden-object' as const,
      key: e.key,
      slug,
      title: e.bookTitle,
      group: e.category,
      section: e.category,
      path: `/activity/hidden-object/${slug}`,
      sourceHref: `/library/${e.bookId}`,
      sourceLabel: BOOK_CTA,
      image: e.sceneImageUrl,
      blurb: e.blurb,
    };
  });
}

/** 페이지 `<title>` 규칙 — 서버 SSR(`seo-activity.service`)과 클라 `useSeo` 가 공유한다. */
export function activityPageTitle(item: ActivityItem): string {
  switch (item.kind) {
    case 'coloring':
      return item.key.startsWith('bk-')
        ? `${item.title} 색칠도안 — ${item.section} | 탱고북`
        : `${item.title} 색칠도안 무료 인쇄 · 온라인 색칠공부 | 탱고북`;
    case 'hidden-object':
      return `${item.title} 숨은그림찾기 도안 무료 인쇄 · 온라인 게임 | 탱고북`;
    case 'hangul':
      return `${item.title} 한글 학습지 무료 인쇄 | 탱고북`;
    case 'english':
      return `${item.title} 영어 파닉스 학습지 무료 인쇄 | 탱고북`;
  }
}

/** 세그먼트(디코드된 값) → 항목. `canonical=false` 면 정규 주소(`item.path`)로 301/replace. */
export function findActivity(
  kind: ActivityKind,
  items: ActivityItem[],
  segment: string
): { item: ActivityItem; canonical: boolean } | null {
  const key = parseActivityKey(kind, segment);
  if (!key) return null;
  const item = items.find((i) => i.key === key);
  return item ? { item, canonical: segment === item.slug } : null;
}

/** 같은 갈래의 다음 항목(끝이면 처음으로). 「다음 도안 →」 링크용. */
export function nextInGroup(items: ActivityItem[], key: string): ActivityItem | null {
  const cur = items.find((i) => i.key === key);
  if (!cur) return null;
  const same = items.filter((i) => i.group === cur.group);
  if (same.length < 2) return null;
  return same[(same.findIndex((i) => i.key === key) + 1) % same.length];
}
