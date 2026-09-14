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
    groups.push({ id, title, kind, bookIds });
  }
  return { groups };
}

const SUFFIX = /_그림체(\d+)$/;

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
    out.push({
      id: `style-${list.map((l) => l.id).sort()[0]}`,
      title: stem,
      kind: 'style',
      bookIds: list.sort((a, b) => a.n - b.n).map((l) => l.id),
    });
  }
  return out;
}
