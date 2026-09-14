/**
 * 동화책 그룹 — 여러 권을 한 작품으로 묶는다.
 *
 * 한 책 = 한 그림체가 되면서 「같은 이야기의 다른 그림체」를 이어 주는 자리가 책 안(`styleAssets`)에서
 * 책 밖으로 나왔다. 그 목록이 이것이다. R2 `_index/book-groups.json` 한 곳에만 둔다 —
 * 책마다 `groupId` 를 적으면 그림체 거울과 같은 동기화 문제가 다시 생긴다.
 */

/** style = 같은 작품의 그림체 변형(학습자 그림체 칩) · series = 시리즈 묶음. */
export type BookGroupKind = 'style' | 'series';

export interface BookGroup {
  id: string;
  title: string;
  kind: BookGroupKind;
  /** 순서가 곧 표시 순서(그림체 칩 순서). */
  bookIds: string[];
  /**
   * 대표 책 — SEO 정본(canonical·sitemap)과 학습자 기본 진입. 없으면 `bookIds[0]`.
   * 명작은 원본 id(페이퍼 3D)다 — 학습 기록·검색 색인·유튜브 링크가 이미 그 id 를 가리킨다.
   */
  primaryId?: string;
}

export interface BookGroupsDoc {
  groups: BookGroup[];
  updatedAt?: string;
}

const KINDS: BookGroupKind[] = ['style', 'series'];

/**
 * 저장 전 정리. 🔴 **한 책은 같은 종류의 그룹에 하나만** — 한 권이 두 「그림체 묶음」에 들어가면
 * 학습자 칩이 어느 작품을 보여 줄지 정할 수 없다. 겹치면 **앞 그룹이 가진다**.
 */
export function sanitizeBookGroups(input: unknown): BookGroupsDoc {
  const raw = (input as { groups?: unknown })?.groups;
  const taken: Record<BookGroupKind, Set<string>> = { style: new Set(), series: new Set() };
  const ids = new Set<string>();
  const groups: BookGroup[] = [];
  for (const g of Array.isArray(raw) ? raw : []) {
    const id = typeof g?.id === 'string' ? g.id.trim() : '';
    const title = typeof g?.title === 'string' ? g.title.trim() : '';
    const kind: BookGroupKind = KINDS.includes(g?.kind) ? g.kind : 'style';
    if (!id || !title || ids.has(id)) continue;
    const bookIds: string[] = [];
    for (const b of Array.isArray(g.bookIds) ? g.bookIds : []) {
      if (typeof b !== 'string' || !b || taken[kind].has(b)) continue;
      taken[kind].add(b);
      bookIds.push(b);
    }
    ids.add(id);
    const primaryId =
      typeof g.primaryId === 'string' && bookIds.includes(g.primaryId) ? g.primaryId : undefined;
    groups.push(primaryId ? { id, title, kind, bookIds, primaryId } : { id, title, kind, bookIds });
  }
  return { groups };
}

const SUFFIX = /_그림체(\d+)$/;

/**
 * 학습자·검색엔진에게 보이는 제목 — 저작용 꼬리표 「_그림체N」 을 뗀다.
 * 그림체별로 쪼갠 책은 제목이 `신데렐라_그림체1` 이지만 아이·부모·구글에게는 그냥 「신데렐라」다
 * (그룹 이름도 같은 규칙으로 만든다). 다른 언어 제목엔 꼬리표가 없으니 번역이 있으면 그걸 쓴다.
 */
export function stripStyleSuffix(title: string): string {
  return title.replace(SUFFIX, '');
}

export function bookDisplayTitle(
  book: { title: string; titleTranslations?: Record<string, string> },
  lang = 'ko'
): string {
  const tr = lang !== 'ko' ? book.titleTranslations?.[lang]?.trim() : undefined;
  return tr || stripStyleSuffix(book.title);
}

/** 그룹의 대표 책 id. */
export function groupPrimaryId(group: BookGroup): string | undefined {
  return group.primaryId && group.bookIds.includes(group.primaryId)
    ? group.primaryId
    : group.bookIds[0];
}

/** 책 id → 그 책이 든 그림체 묶음. */
export function styleGroupIndex(groups: BookGroup[]): Map<string, BookGroup> {
  const m = new Map<string, BookGroup>();
  for (const g of groups) if (g.kind === 'style') for (const id of g.bookIds) m.set(id, g);
  return m;
}

/**
 * 제목으로 그림체 묶음을 제안한다 — `신데렐라` · `신데렐라_그림체1` · `신데렐라_그림체3` → 한 그룹.
 * 이미 어느 그림체 그룹에 든 책은 건너뛴다. 묶을 짝이 없는(1권뿐인) 제목은 제안하지 않는다.
 * 순서 = 그림체 번호, 번호 없는 원본은 2번 자리(원본 id 는 페이퍼 3D = 그림체2 가 이어받는다).
 */
export function suggestStyleGroups(
  books: Array<{ id: string; title: string }>,
  existing: BookGroup[]
): BookGroup[] {
  const grouped = new Set(existing.filter((g) => g.kind === 'style').flatMap((g) => g.bookIds));
  const stems = new Map<string, Array<{ id: string; n: number }>>();
  for (const b of books) {
    if (grouped.has(b.id)) continue;
    const m = b.title.match(SUFFIX);
    const stem = m ? b.title.slice(0, m.index) : b.title;
    const n = m ? Number(m[1]) : 2;
    const list = stems.get(stem) ?? [];
    list.push({ id: b.id, n });
    stems.set(stem, list);
  }
  const out: BookGroup[] = [];
  for (const [stem, list] of stems) {
    // 번호 붙은 책이 하나도 없으면 그냥 같은 제목일 뿐이다.
    if (
      list.length < 2 ||
      !books.some((b) => list.some((l) => l.id === b.id) && SUFFIX.test(b.title))
    )
      continue;
    const bare = list.find((l) => !SUFFIX.test(books.find((b) => b.id === l.id)?.title ?? ''));
    out.push({
      id: `style-${list.map((l) => l.id).sort()[0]}`,
      title: stem,
      kind: 'style',
      bookIds: list.sort((a, b) => a.n - b.n).map((l) => l.id),
      ...(bare ? { primaryId: bare.id } : {}),
    });
  }
  return out;
}

/**
 * 목록에서 같은 그림체 묶음을 한 권으로 접는다 — 라이브러리 카드·묶어 보기·사이트맵이 같은 규칙을 쓴다.
 * 접은 자리는 **그 묶음이 목록에 처음 나온 자리**다(정렬을 흐트리지 않는다).
 * `choose` 가 없으면 대표 책(목록에 있으면), 없으면 목록에 있는 첫 멤버.
 * 목록에 없는 멤버(비공개 등)는 고려하지 않는다.
 */
export function collapseStyleGroups<T extends { id: string }>(
  list: T[],
  groups: BookGroup[],
  choose?: (members: T[], group: BookGroup) => T | undefined
): T[] {
  const index = styleGroupIndex(groups);
  const byGroup = new Map<string, T[]>();
  for (const b of list) {
    const g = index.get(b.id);
    if (g) byGroup.set(g.id, [...(byGroup.get(g.id) ?? []), b]);
  }
  const done = new Set<string>();
  const out: T[] = [];
  for (const b of list) {
    const g = index.get(b.id);
    if (!g) {
      out.push(b);
      continue;
    }
    if (done.has(g.id)) continue;
    done.add(g.id);
    const members = byGroup.get(g.id)!;
    const primary = members.find((m) => m.id === groupPrimaryId(g));
    out.push(choose?.(members, g) ?? primary ?? members[0]);
  }
  return out;
}
