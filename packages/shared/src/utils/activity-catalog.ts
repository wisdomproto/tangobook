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
  /** 같은 제목이 여럿일 때 붙는 갈래 이름(페이퍼 3D 아트 등) — 제목 뒤 괄호로 보인다. */
  styleLabel?: string;
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
      // 🔴 slug 는 styleLabel 없이 만든다 — 붙이기 전 주소(sitemap·IndexNow 에 이미 나감)가 그대로 살아 있게.
      title: e.styleLabel ? `${e.bookTitle} (${e.styleLabel})` : e.bookTitle,
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

// ── 종류 대표 페이지 `/activity/{kind}` ─────────────────────────────────────────
// 🔴 「한글공부·한글학습지·파닉스·색칠도안·숨은그림찾기」 같은 **큰 검색어를 받는 자리**다(2026-09-15 사용자).
//    단원·낱말 페이지는 제 이름으로만 검색된다. 문구·목록은 여기 한 벌 — SSR 과 화면이 같은 글을 쓴다.
//    화면은 목록(고르기)이 먼저, 설명·자주 묻는 질문은 **아래에 접어** 둔다(글을 숨기지 않는다 — 숨긴 글은 검색 벌점).

export const activityKindPath = (kind: ActivityKind) => `/activity/${kind}`;

export interface ActivityKindLanding {
  title: string;
  h1: string;
  lead: string;
  about: string[];
  faq: [string, string][];
}

export function activityKindLanding(kind: ActivityKind, count: number): ActivityKindLanding {
  const n = count.toLocaleString('ko-KR');
  switch (kind) {
    case 'hangul':
      return {
        title: `무료 한글 학습지 인쇄 · 한글공부 워크지 ${n}단원 | 탱고북`,
        h1: '한글 학습지',
        lead: `모음·자음부터 받침까지 ${n}단원. 인쇄해서 연필로 쓰고, 온라인에서도 바로 써요.`,
        about: [
          '한글떼기를 시작하는 아이를 위한 한글공부 워크지입니다. 모음 → 자음(ㄱ~ㅎ) → 받침 → 쌍자음 → 복잡한 모음 순서로 한 단원씩 나아갑니다.',
          '단원마다 글자 쓰기, 자음과 모음을 합쳐 글자 만들기, 그림을 보며 낱말 쓰기가 들어 있어요. 온라인에서는 큰 칸에 손가락으로 쓰고, 다 쓰면 그 글자를 소리 내어 읽어 줍니다.',
          '가입 없이 무료이고, A4 로 한 단원·한 권·전체를 한 번에 인쇄할 수 있어요.',
        ],
        faq: [
          [
            '몇 살부터 쓰나요?',
            '4~7세 아이를 위해 만들었어요. 글자 모양에 관심을 보이면 모음 단원부터 시작해 보세요.',
          ],
          [
            '어떤 순서로 하나요?',
            '한글1 기본음절(모음, ㄱ~ㅎ) → 한글2 받침 → 한글3 쌍자음 → 한글4 복잡한 모음 순서예요.',
          ],
          ['정말 무료인가요?', '네. 가입 없이 인쇄도 온라인 쓰기도 무료예요.'],
          [
            '어떻게 인쇄하나요?',
            '단원을 고른 뒤 인쇄 버튼을 누르면 A4 인쇄 화면이 열려요. 권 전체나 전체 단원도 한 번에 뽑을 수 있어요.',
          ],
        ],
      };
    case 'english':
      return {
        title: `무료 영어 파닉스 학습지 인쇄 · 파닉스 워크시트 ${n}단원 | 탱고북`,
        h1: '영어 파닉스 학습지',
        lead: `알파벳 소리부터 이중모음까지 ${n}단원. 인쇄해서 쓰고, 온라인에서 소리를 들으며 써요.`,
        about: [
          '처음 영어 파닉스를 배우는 아이를 위한 파닉스 워크시트입니다. Book 1 알파벳 소리 → Book 2 단모음 → Book 3 매직 e → Book 4 자음 블렌드 → Book 5 이중모음 순서로 나아갑니다.',
          '알파벳은 한 글자씩(A, B, C), 소리 덩이는 하나씩(-an, -at) 따로 익혀요. 그림을 보고 낱말을 쓰고, 온라인에서는 다 쓰면 “a a apple”처럼 소리를 들려줍니다.',
          '가입 없이 무료이고, A4 로 한 부분·한 권·전체를 인쇄할 수 있어요.',
        ],
        faq: [
          [
            '몇 살부터 쓰나요?',
            '알파벳을 처음 만나는 5~7세 아이를 위해 만들었어요. Book 1 알파벳 소리부터 시작하세요.',
          ],
          [
            '파닉스는 어떤 순서로 하나요?',
            '알파벳 소리 → 단모음(cat, pig) → 매직 e(cake) → 자음 블렌드(frog) → 이중모음(boat) 순서예요.',
          ],
          ['정말 무료인가요?', '네. 가입 없이 인쇄도 온라인 쓰기도 무료예요.'],
          [
            '어떻게 인쇄하나요?',
            '글자나 소리 덩이를 고른 뒤 인쇄 버튼을 누르면 A4 인쇄 화면이 열려요. Book 전체나 전체 단원도 한 번에 뽑을 수 있어요.',
          ],
        ],
      };
    case 'coloring':
      return {
        title: `무료 색칠도안 인쇄 · 색칠공부 도안 ${n}장 | 탱고북`,
        h1: '색칠도안',
        lead: `동화책과 파닉스 낱말 그림 ${n}장. 인쇄해서 칠하고, 온라인에서도 바로 칠해요.`,
        about: [
          '세계 명작, 전래 동화, 공룡·동물·식물 이야기에 나오는 낱말 그림을 색칠공부 도안으로 만들었습니다. 한글·영어 파닉스 낱말 그림도 있어요.',
          '온라인에서는 색을 골라 칸 안을 칠하고, 다 칠하면 그 낱말이 나오는 동화책 장면을 읽어 줍니다.',
          '가입 없이 무료이고, 한 장씩 또는 책 한 권의 도안을 색칠책처럼 한 번에 인쇄할 수 있어요.',
        ],
        faq: [
          ['정말 무료인가요?', '네. 가입 없이 인쇄도 온라인 색칠도 무료예요.'],
          [
            '어떻게 인쇄하나요?',
            '도안을 고른 뒤 인쇄를 누르면 A4 한 장으로 나와요. 「이 책 색칠책 인쇄」로 책 한 권의 도안을 모아 뽑을 수도 있어요.',
          ],
          ['몇 살에게 맞나요?', '큰 칸이 많은 도안이라 4~7세 아이가 칠하기 좋아요.'],
        ],
      };
    case 'hidden-object':
      return {
        title: `무료 숨은그림찾기 도안 인쇄 · 온라인 숨은그림찾기 ${n}장 | 탱고북`,
        h1: '숨은그림찾기',
        lead: `동화 속 장면 ${n}장에서 숨은 그림을 찾아요. 인쇄해도, 온라인에서 눌러 찾아도 돼요.`,
        about: [
          '세계 명작, 전래 동화, 자연관찰 동화의 장면을 숨은그림찾기 도안으로 만들었습니다. 장면마다 찾을 낱말이 적혀 있어요.',
          '온라인에서는 그림을 눌러 찾고, 찾을 때마다 그 낱말을 소리 내어 읽어 줍니다.',
          '가입 없이 무료이고, 찾을 것 목록과 함께 A4 한 장으로 인쇄할 수 있어요.',
        ],
        faq: [
          ['정말 무료인가요?', '네. 가입 없이 인쇄도 온라인 찾기도 무료예요.'],
          [
            '어떻게 인쇄하나요?',
            '장면을 고른 뒤 인쇄를 누르면 그림과 찾을 것 목록이 A4 한 장으로 나와요.',
          ],
          ['몇 살에게 맞나요?', '찾을 것이 낱말 카드로 나와 4~7세 아이도 스스로 찾을 수 있어요.'],
        ],
      };
  }
}

export interface ActivityLandingSection {
  group: string;
  links: { title: string; path: string; count: number }[];
}

/** 대표 페이지 목록 — 갈래마다, 책으로 묶이는 종류(색칠)는 책 하나 = 링크 하나(그 책 첫 도안). */
export function activityLandingSections(items: ActivityItem[]): ActivityLandingSection[] {
  const out: ActivityLandingSection[] = [];
  for (const it of items) {
    let sec = out.find((s) => s.group === it.group);
    if (!sec) out.push((sec = { group: it.group, links: [] }));
    if (it.section === it.group) {
      sec.links.push({ title: it.title, path: it.path, count: 1 });
      continue;
    }
    const book = sec.links.find((l) => l.title === it.section);
    if (book) book.count++;
    else sec.links.push({ title: it.section, path: it.path, count: 1 });
  }
  return out;
}
