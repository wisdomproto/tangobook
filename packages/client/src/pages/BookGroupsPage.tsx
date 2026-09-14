import { useEffect, useMemo, useState, type ReactNode, type ButtonHTMLAttributes } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  suggestStyleGroups,
  type BookGroup,
  type BookGroupKind,
  type StorybookSummary,
} from '@tangobook/shared';
import { useStorybooks } from '@/features/storybook';
import { useBookGroups, useSaveBookGroups } from '@/features/library/hooks/useBookGroups';

const KIND_LABEL: Record<BookGroupKind, string> = { style: '🎨 그림체 묶음', series: '📚 시리즈' };

/**
 * 동화책 그룹 편집 — 여러 권을 한 작품(그림체 묶음)·시리즈로 묶는다.
 * 저장은 **명시적 버튼** — 전체 문서를 통째로 덮으므로 편집 중간 상태가 새지 않게.
 */
export default function BookGroupsPage() {
  const navigate = useNavigate();
  const { data: books, isLoading } = useStorybooks();
  const { data: doc } = useBookGroups();
  const save = useSaveBookGroups();

  const [groups, setGroups] = useState<BookGroup[]>([]);
  const [dirty, setDirty] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [listQuery, setListQuery] = useState('');

  useEffect(() => {
    if (doc && !dirty) setGroups(doc.groups);
  }, [doc, dirty]);

  const byId = useMemo(() => new Map((books ?? []).map((b) => [b.id, b])), [books]);
  const active = groups.find((g) => g.id === activeId) ?? null;
  const suggestions = useMemo(() => suggestStyleGroups(books ?? [], groups), [books, groups]);

  /** 책 id → 그 책이 든 그룹들(다른 그룹에 이미 든 책 표시용). */
  const memberOf = useMemo(() => {
    const m = new Map<string, BookGroup[]>();
    for (const g of groups) for (const id of g.bookIds) m.set(id, [...(m.get(id) ?? []), g]);
    return m;
  }, [groups]);

  const edit = (fn: (gs: BookGroup[]) => BookGroup[]) => {
    setGroups(fn);
    setDirty(true);
  };
  const patch = (id: string, p: Partial<BookGroup>) =>
    edit((gs) => gs.map((g) => (g.id === id ? { ...g, ...p } : g)));

  const addGroup = () => {
    const g: BookGroup = {
      id: `group-${Date.now()}`,
      title: '새 그룹',
      kind: 'style',
      bookIds: [],
    };
    edit((gs) => [g, ...gs]);
    setActiveId(g.id);
  };
  const acceptSuggestions = () => edit((gs) => [...gs, ...suggestions]);

  const move = (i: number, d: -1 | 1) => {
    if (!active) return;
    const ids = [...active.bookIds];
    const j = i + d;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    patch(active.id, { bookIds: ids });
  };

  const candidates = useMemo(() => {
    const q = query.trim();
    if (!active || !q) return [];
    return (books ?? [])
      .filter((b) => b.title.includes(q) && !active.bookIds.includes(b.id))
      .slice(0, 30);
  }, [books, query, active]);

  const shownGroups = groups.filter((g) => !listQuery.trim() || g.title.includes(listQuery.trim()));

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 to-peach-100">
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur border-b border-ink-100 shadow-soft">
        <div className="max-w-[1480px] mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/library-master')}
              className="px-4 py-2 rounded-full bg-peach-100 text-ink-900 font-black text-base hover:bg-peach-200"
            >
              ← 라이브러리 마스터
            </button>
            <h1 className="text-2xl md:text-3xl font-black font-display text-ink-900">
              🗂️ 동화책 그룹
            </h1>
            <span className="text-sm text-ink-600">그룹 {groups.length}개</span>
          </div>
          <div className="flex items-center gap-3">
            {save.isError && <span className="text-danger font-bold text-sm">저장 실패</span>}
            {dirty && <span className="text-coral-600 font-bold text-sm">저장 안 됨</span>}
            <button
              onClick={() => save.mutate({ groups }, { onSuccess: () => setDirty(false) })}
              disabled={!dirty || save.isPending}
              className="px-5 py-2 rounded-full bg-coral-500 text-white font-black hover:bg-coral-600 disabled:opacity-40"
            >
              {save.isPending ? '저장 중…' : '저장'}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1480px] mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
        <aside className="bg-white rounded-3xl shadow-soft p-4 space-y-3 self-start">
          <div className="flex gap-2">
            <button
              onClick={addGroup}
              className="flex-1 px-3 py-2 rounded-xl bg-peach-100 font-black text-ink-900 hover:bg-peach-200"
            >
              ＋ 새 그룹
            </button>
            <button
              onClick={acceptSuggestions}
              disabled={suggestions.length === 0}
              title="제목이 같은 책과 「_그림체N」 책을 한 그룹으로"
              className="flex-1 px-3 py-2 rounded-xl bg-mint-100 font-black text-ink-900 hover:bg-mint-200 disabled:opacity-40"
            >
              🪄 그림체로 묶기 ({suggestions.length})
            </button>
          </div>
          <input
            value={listQuery}
            onChange={(e) => setListQuery(e.target.value)}
            placeholder="그룹 검색"
            className="w-full px-3 py-2 rounded-xl border border-ink-100"
          />
          <ul className="space-y-1 max-h-[70vh] overflow-y-auto">
            {shownGroups.map((g) => (
              <li key={g.id}>
                <button
                  onClick={() => setActiveId(g.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between gap-2 ${
                    g.id === activeId ? 'bg-coral-100' : 'hover:bg-peach-50'
                  }`}
                >
                  <span className="font-bold text-ink-900 truncate">{g.title}</span>
                  <span className="shrink-0 text-xs text-ink-600">
                    {g.kind === 'style' ? '🎨' : '📚'} {g.bookIds.length}권
                  </span>
                </button>
              </li>
            ))}
            {!isLoading && groups.length === 0 && (
              <li className="text-sm text-ink-600 px-3 py-6 text-center">
                아직 그룹이 없어요. 🪄 로 명작 그림체 묶음을 한 번에 만들 수 있어요.
              </li>
            )}
          </ul>
        </aside>

        <section className="bg-white rounded-3xl shadow-soft p-5 min-h-[60vh]">
          {!active ? (
            <p className="text-ink-600 text-center py-20">왼쪽에서 그룹을 고르세요.</p>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <input
                  value={active.title}
                  onChange={(e) => patch(active.id, { title: e.target.value })}
                  className="flex-1 min-w-[240px] text-2xl font-black font-display px-3 py-2 rounded-xl border border-ink-100"
                />
                <select
                  value={active.kind}
                  onChange={(e) => patch(active.id, { kind: e.target.value as BookGroupKind })}
                  className="px-3 py-2 rounded-xl border border-ink-100 font-bold"
                >
                  {Object.entries(KIND_LABEL).map(([k, l]) => (
                    <option key={k} value={k}>
                      {l}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    edit((gs) => gs.filter((g) => g.id !== active.id));
                    setActiveId(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-danger/10 text-danger font-black"
                >
                  그룹 삭제
                </button>
              </div>

              <p className="text-sm text-ink-600">
                {active.kind === 'style'
                  ? '순서가 학습자 그림체 칩 순서예요. 한 책은 그림체 묶음 하나에만 들어갈 수 있어요.'
                  : '순서가 시리즈 순서예요.'}
              </p>

              <ol className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {active.bookIds.map((id, i) => (
                  <BookTile key={id} book={byId.get(id)} id={id}>
                    <div className="flex items-center justify-between gap-1 pt-2">
                      <span className="text-xs font-black text-ink-500">{i + 1}</span>
                      <div className="flex gap-1">
                        <SmallBtn onClick={() => move(i, -1)} disabled={i === 0}>
                          ◀
                        </SmallBtn>
                        <SmallBtn
                          onClick={() => move(i, 1)}
                          disabled={i === active.bookIds.length - 1}
                        >
                          ▶
                        </SmallBtn>
                        <SmallBtn
                          onClick={() =>
                            patch(active.id, { bookIds: active.bookIds.filter((b) => b !== id) })
                          }
                        >
                          ✕
                        </SmallBtn>
                      </div>
                    </div>
                  </BookTile>
                ))}
              </ol>

              <div className="border-t border-ink-100 pt-4 space-y-3">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="책 제목으로 찾아 추가"
                  className="w-full px-3 py-2 rounded-xl border border-ink-100"
                />
                <ul className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                  {candidates.map((b) => {
                    const other = (memberOf.get(b.id) ?? []).filter((g) => g.kind === active.kind);
                    return (
                      <li key={b.id}>
                        <button
                          onClick={() => patch(active.id, { bookIds: [...active.bookIds, b.id] })}
                          disabled={other.length > 0}
                          title={other.length ? `이미 「${other[0].title}」 그룹에 있어요` : '추가'}
                          className="w-full text-left disabled:opacity-40"
                        >
                          <BookTile book={b} id={b.id}>
                            {other.length > 0 && (
                              <span className="text-xs text-ink-600">
                                「{other[0].title}」에 있음
                              </span>
                            )}
                          </BookTile>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function BookTile({
  book,
  id,
  children,
}: {
  book: StorybookSummary | undefined;
  id: string;
  children?: ReactNode;
}) {
  const cover = (book?.artStyle && book.coversByStyle?.[book.artStyle]) || book?.coverImage;
  return (
    <div className="rounded-2xl border border-ink-100 p-2 bg-cream-50">
      <div className="aspect-video rounded-xl overflow-hidden bg-ink-100">
        {/* 요약 coverImage 는 「대표 그림체」 표지라 원본 책에선 다른 그림체가 나온다 — 그 책의 활성 그림체 표지를 쓴다. */}
        {cover && <img src={cover} alt="" className="w-full h-full object-cover" />}
      </div>
      <p className="mt-2 text-sm font-bold text-ink-900 break-keep">
        {book?.title ?? `(없는 책 ${id})`}
      </p>
      <p className="text-xs text-ink-500">
        {book ? `${book.category ?? ''} · ${book.isPublic ? '공개' : '비공개'}` : ''}
      </p>
      {children}
    </div>
  );
}

function SmallBtn(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="w-7 h-7 rounded-lg bg-white border border-ink-100 text-xs font-black text-ink-700 hover:bg-peach-50 disabled:opacity-30"
    />
  );
}
