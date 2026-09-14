import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  sortableKeyboardCoordinates,
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { useStorybooks } from '@/features/storybook';
import { useLibraryConfig, useUpdateLibraryConfig, useCategoryActions } from '@/features/library';
import type { LibraryConfig, StorybookSummary } from '@tangobook/shared';
import { CategoryPanel } from '@/features/library/components/CategoryPanel';
import { BookCardEditable } from '@/features/library/components/BookCardEditable';
import { MoveBooksModal } from '@/features/library/components/MoveBooksModal';
import { BookMatrixModal } from '@/features/library/components/BookMatrixModal';
import { useBookGroups, useSaveBookGroups } from '@/features/library/hooks/useBookGroups';
import type { BookGroup } from '@tangobook/shared';

const DEFAULT_CATEGORY_ORDER = [
  '세계 명작',
  '전래 동화',
  '공룡 친구들',
  '곤충 친구들',
  '육지 동물 친구들',
  '바다 동물 친구들',
  '하늘 동물 친구들',
  '식물 친구들',
  '우주와 자연',
  '우리 몸 이야기',
  '기타',
  // legacy fallback
  '자연 관찰',
  '생활 동화',
];

const CATEGORY_EMOJI: Record<string, string> = {
  '세계 명작': '🌟',
  '전래 동화': '📜',
  '공룡 친구들': '🦕',
  '곤충 친구들': '🐛',
  '육지 동물 친구들': '🐯',
  '바다 동물 친구들': '🐬',
  '하늘 동물 친구들': '🦅',
  '식물 친구들': '🌸',
  '우주와 자연': '🌌',
  '우리 몸 이야기': '🫀',
  '자연 관찰': '🌿',
  '생활 동화': '👨‍👩‍👧',
  기타: '📚',
};

function emojiOf(cat: string): string {
  return CATEGORY_EMOJI[cat] ?? '📚';
}

function deriveAllCategories(books: StorybookSummary[]): string[] {
  const set = new Set<string>();
  books.forEach((b) => {
    if (b.type && b.type !== 'storybook') return;
    set.add(b.category || '기타');
  });
  return [...set];
}

function mergeCategoryOrder(
  configOrder: string[] | undefined,
  configList: string[] | undefined,
  derived: string[]
): string[] {
  const all = new Set<string>([...(configList ?? []), ...derived]);
  const ordered: string[] = [];
  (configOrder ?? []).forEach((c) => {
    if (all.has(c) && !ordered.includes(c)) ordered.push(c);
  });
  DEFAULT_CATEGORY_ORDER.forEach((c) => {
    if (all.has(c) && !ordered.includes(c)) ordered.push(c);
  });
  [...all]
    .filter((c) => !ordered.includes(c))
    .sort()
    .forEach((c) => ordered.push(c));
  return ordered;
}

function orderBooksInCategory(
  cat: string,
  books: StorybookSummary[],
  bookPriority: Record<string, string[]> | undefined
): StorybookSummary[] {
  // /library-master 는 비공개 책도 표시 (편집 대상이므로). storybook 만.
  const pool = books.filter(
    (b) => (!b.type || b.type === 'storybook') && (b.category || '기타') === cat
  );
  const priorityIds = bookPriority?.[cat] ?? [];
  const idIdx = new Map(priorityIds.map((id, i) => [id, i]));
  const inPriority: StorybookSummary[] = [];
  const rest: StorybookSummary[] = [];
  pool.forEach((b) => {
    if (idIdx.has(b.id)) inPriority.push(b);
    else rest.push(b);
  });
  inPriority.sort((a, b) => (idIdx.get(a.id) ?? 0) - (idIdx.get(b.id) ?? 0));
  rest.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return [...inPriority, ...rest];
}

export default function LibraryMasterPage() {
  const navigate = useNavigate();
  const { data: storybooks, isLoading } = useStorybooks();
  const { data: config } = useLibraryConfig();
  const update = useUpdateLibraryConfig();

  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [moveFromCat, setMoveFromCat] = useState<string | null>(null);
  const [progressText, setProgressText] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [selectedLang, setSelectedLang] = useState<string>('ko');
  const [matrixOpen, setMatrixOpen] = useState(false);

  // ── 그룹 묶기 (같은 작품의 그림체 여러 권 · 시리즈) ── 정본은 R2 _index/book-groups.json
  const { data: groupsDoc } = useBookGroups();
  const saveGroups = useSaveBookGroups();
  const groups = useMemo(() => groupsDoc?.groups ?? [], [groupsDoc]);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);
  /** 책 id → 그림체 묶음. 카드 배지용(시리즈는 /book-groups 에서). */
  const styleGroupOf = useMemo(() => {
    const m = new Map<string, BookGroup>();
    for (const g of groups) if (g.kind === 'style') for (const id of g.bookIds) m.set(id, g);
    return m;
  }, [groups]);
  const persistGroups = (next: BookGroup[]) =>
    saveGroups.mutate({ groups: next }, { onSuccess: flashSaved });
  const groupSelected = () => {
    const titles = selected.map((id) => storybooks?.find((b) => b.id === id)?.title ?? '');
    const guess = (titles[0] ?? '').replace(/_그림체\d+$/, '');
    const title = window.prompt('그룹 이름', guess)?.trim();
    if (!title) return;
    // 🔴 한 책은 그림체 묶음 하나에만 — 고른 책을 기존 그룹에서 먼저 뺀다(서버도 앞 그룹 우선으로 거른다).
    const rest = groups
      .map((g) =>
        g.kind === 'style' ? { ...g, bookIds: g.bookIds.filter((b) => !selected.includes(b)) } : g
      )
      .filter((g) => g.bookIds.length > 0);
    persistGroups([
      ...rest,
      { id: `group-${Date.now()}`, title, kind: 'style', bookIds: selected },
    ]);
    setSelected([]);
    setSelectMode(false);
  };
  const ungroup = (groupId: string, bookId: string) =>
    persistGroups(
      groups
        .map((g) =>
          g.id === groupId ? { ...g, bookIds: g.bookIds.filter((b) => b !== bookId) } : g
        )
        .filter((g) => g.bookIds.length > 0)
    );
  const openGroup = groups.find((g) => g.id === openGroupId) ?? null;

  const flashSaved = () => {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  };

  const actions = useCategoryActions({
    config,
    books: storybooks,
    onProgress: setProgressText,
  });

  const derivedCats = useMemo(
    () => (storybooks ? deriveAllCategories(storybooks) : []),
    [storybooks]
  );
  const categoryOrder = useMemo(
    () => mergeCategoryOrder(config?.categoryOrder, config?.categoryList, derivedCats),
    [config?.categoryOrder, config?.categoryList, derivedCats]
  );

  useEffect(() => {
    if (!activeCat && categoryOrder.length > 0) setActiveCat(categoryOrder[0]);
  }, [categoryOrder, activeCat]);

  useEffect(() => {
    if (activeCat && !categoryOrder.includes(activeCat)) {
      setActiveCat(categoryOrder[0] ?? null);
    }
  }, [categoryOrder, activeCat]);

  const activeBooks = useMemo(() => {
    if (!storybooks || !activeCat) return [];
    return orderBooksInCategory(activeCat, storybooks, config?.bookPriority);
  }, [storybooks, activeCat, config?.bookPriority]);

  const booksByCategory = useMemo(() => {
    const map: Record<string, StorybookSummary[]> = {};
    if (!storybooks) return map;
    categoryOrder.forEach((cat) => {
      map[cat] = orderBooksInCategory(cat, storybooks, config?.bookPriority);
    });
    return map;
  }, [storybooks, categoryOrder, config?.bookPriority]);

  const countOf = (cat: string) =>
    storybooks?.filter((b) => (!b.type || b.type === 'storybook') && (b.category || '기타') === cat)
      .length ?? 0;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const persistConfig = (next: LibraryConfig) => {
    update.mutate(next, { onSuccess: flashSaved });
  };

  const handleDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    // 카테고리 reorder
    if (categoryOrder.includes(activeId) && categoryOrder.includes(overId)) {
      const oldIdx = categoryOrder.indexOf(activeId);
      const newIdx = categoryOrder.indexOf(overId);
      if (oldIdx < 0 || newIdx < 0) return;
      const next = arrayMove(categoryOrder, oldIdx, newIdx);
      persistConfig({ ...(config ?? {}), categoryOrder: next });
      return;
    }

    // 책 reorder (활성 카테고리 안)
    if (activeCat) {
      const ids = activeBooks.map((b) => b.id);
      const oldIdx = ids.indexOf(activeId);
      const newIdx = ids.indexOf(overId);
      if (oldIdx < 0 || newIdx < 0) return;
      const nextIds = arrayMove(ids, oldIdx, newIdx);
      const nextPriority = { ...(config?.bookPriority ?? {}), [activeCat]: nextIds };
      persistConfig({ ...(config ?? {}), bookPriority: nextPriority });
    }
  };

  const moveCandidates = categoryOrder.filter((c) => c !== moveFromCat);

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 to-peach-100">
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur border-b border-ink-100 shadow-soft">
        <div className="max-w-[1480px] mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/library')}
              className="px-4 py-2 rounded-full bg-peach-100 text-ink-900 font-black text-base hover:bg-peach-200 transition"
              aria-label="라이브러리로 돌아가기"
            >
              ← 라이브러리
            </button>
            <h1 className="text-2xl md:text-3xl font-black font-display text-ink-900 flex items-center gap-2">
              <span>📚</span>
              <span>라이브러리 마스터</span>
            </h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {progressText && <span className="text-ink-600 font-bold">{progressText}</span>}
            {savedFlash && <span className="text-success font-black animate-pulse">✓ 저장됨</span>}
            {update.isPending && <span className="text-ink-500">저장 중...</span>}
          </div>
        </div>
        <div className="max-w-[1480px] mx-auto px-6 pb-3 flex items-center justify-between gap-4">
          <span className="text-sm text-ink-600">
            좌측에서 카테고리 추가/이름변경/삭제, 책 카드의 카테고리 chip · 👁 (공개) 편집. 책 카드
            드래그는 같은 카테고리 안에서 순서 바꾸기만 — 카테고리 이동은 카드 좌상단 카테고리 chip
            으로 하세요.
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setMatrixOpen(true)}
              disabled={!storybooks || storybooks.length === 0}
              className="px-4 py-1.5 rounded-full bg-coral-500 text-white font-black text-sm shadow-soft hover:bg-coral-600 disabled:opacity-40 disabled:cursor-not-allowed"
              title="전체 카테고리의 그림체 × 언어 표"
            >
              📊 표 보기
            </button>
            <span className="text-sm font-black text-ink-700">표지 언어:</span>
            <div className="flex items-center gap-1 bg-ink-100 rounded-full p-1">
              {(['ko', 'en'] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setSelectedLang(lang)}
                  className={`px-4 py-1.5 rounded-full text-sm font-black transition ${
                    selectedLang === lang
                      ? 'bg-white text-ink-900 shadow-soft'
                      : 'text-ink-500 hover:text-ink-700'
                  }`}
                  aria-pressed={selectedLang === lang}
                >
                  {lang === 'ko' ? '🇰🇷 한글' : '🇺🇸 영어'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1480px] mx-auto px-6 py-6">
        {isLoading ? (
          <div className="text-center py-20 text-ink-500">불러오는 중...</div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
              <CategoryPanel
                categories={categoryOrder}
                countOf={countOf}
                emojiOf={emojiOf}
                activeCat={activeCat}
                onSelect={setActiveCat}
                onAdd={actions.addCategory}
                onRename={actions.renameCategory}
                onDelete={actions.deleteCategory}
                onRequestMove={setMoveFromCat}
              />

              <section className="bg-white rounded-3xl shadow-soft p-5">
                {activeCat ? (
                  <>
                    <header className="flex items-center justify-between mb-4 px-1">
                      <h2 className="text-2xl font-black text-ink-900 font-display flex items-center gap-2">
                        <span>{emojiOf(activeCat)}</span>
                        <span>{activeCat}</span>
                        <span className="text-base text-ink-500 font-bold">
                          ({activeBooks.length}권)
                        </span>
                      </h2>
                      <div className="flex items-center gap-2">
                        {selectMode && (
                          <>
                            <span className="text-sm font-bold text-ink-600">
                              {selected.length}권 선택
                            </span>
                            <button
                              type="button"
                              onClick={groupSelected}
                              disabled={selected.length < 2 || saveGroups.isPending}
                              className="px-4 py-1.5 rounded-full bg-mint-500 text-white font-black text-sm disabled:opacity-40"
                            >
                              선택한 책 한 그룹으로
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectMode((v) => !v);
                            setSelected([]);
                          }}
                          className={`px-4 py-1.5 rounded-full font-black text-sm ${
                            selectMode
                              ? 'bg-ink-200 text-ink-700'
                              : 'bg-mint-100 text-mint-700 hover:bg-mint-200'
                          }`}
                        >
                          {selectMode ? '묶기 취소' : '🗂️ 그룹 묶기'}
                        </button>
                      </div>
                    </header>
                    {activeBooks.length === 0 ? (
                      <div className="text-center py-20 text-ink-500 text-sm">
                        이 카테고리에 책이 없어요. 다른 카테고리에서 책을 열고 카드 좌상단의
                        카테고리 chip 으로 이곳으로 옮겨주세요.
                      </div>
                    ) : (
                      <SortableContext
                        items={activeBooks.map((b) => b.id)}
                        strategy={rectSortingStrategy}
                      >
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                          {activeBooks.map((book, idx) => (
                            <BookCardEditable
                              key={book.id}
                              book={book}
                              index={idx}
                              categories={categoryOrder}
                              emojiOf={emojiOf}
                              selectedLang={selectedLang}
                              onChangeCategory={(next) =>
                                actions.setBookCategory(book.id, activeCat, next).then(flashSaved)
                              }
                              onTogglePublic={() =>
                                actions
                                  .setBookPublic(book.id, !(book.isPublic !== false))
                                  .then(flashSaved)
                              }
                              group={(() => {
                                const g = styleGroupOf.get(book.id);
                                return g ? { title: g.title, size: g.bookIds.length } : undefined;
                              })()}
                              selectMode={selectMode}
                              selected={selected.includes(book.id)}
                              onToggleSelect={() =>
                                setSelected((cur) =>
                                  cur.includes(book.id)
                                    ? cur.filter((x) => x !== book.id)
                                    : [...cur, book.id]
                                )
                              }
                              onOpenGroup={() =>
                                setOpenGroupId(styleGroupOf.get(book.id)?.id ?? null)
                              }
                            />
                          ))}
                        </div>
                      </SortableContext>
                    )}
                  </>
                ) : (
                  <div className="text-center py-20 text-ink-500">카테고리를 선택해주세요</div>
                )}
              </section>
            </div>
          </DndContext>
        )}
      </div>

      {moveFromCat && (
        <MoveBooksModal
          fromCategory={moveFromCat}
          bookCount={countOf(moveFromCat)}
          candidates={moveCandidates}
          onClose={() => setMoveFromCat(null)}
          onConfirm={async (to) => {
            await actions.moveBooksAndDelete(moveFromCat, to);
            flashSaved();
          }}
        />
      )}

      {openGroup && (
        <GroupMembersModal
          group={openGroup}
          books={storybooks ?? []}
          onClose={() => setOpenGroupId(null)}
          onRemove={(bookId) => ungroup(openGroup.id, bookId)}
          onOpenEditor={() => navigate('/book-groups')}
        />
      )}

      {matrixOpen && (
        <BookMatrixModal
          categoryOrder={categoryOrder}
          booksByCategory={booksByCategory}
          emojiOf={emojiOf}
          initialOpenCat={activeCat ?? undefined}
          onClose={() => setMatrixOpen(false)}
          onSavedFlash={flashSaved}
        />
      )}
    </div>
  );
}

/** 그룹 배지를 누르면 뜨는 창 — 이 묶음에 무엇이 들었는지. 순서가 곧 학습자 그림체 칩 순서. */
function GroupMembersModal({
  group,
  books,
  onClose,
  onRemove,
  onOpenEditor,
}: {
  group: BookGroup;
  books: StorybookSummary[];
  onClose: () => void;
  onRemove: (bookId: string) => void;
  onOpenEditor: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-ink-900/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-soft w-full max-w-3xl p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-black text-ink-900 font-display truncate">
            🗂️ {group.title}{' '}
            <span className="text-base text-ink-500">({group.bookIds.length}권)</span>
          </h2>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenEditor}
              className="px-3 py-1.5 rounded-full bg-peach-100 text-ink-900 font-black text-sm hover:bg-peach-200"
            >
              순서·이름 편집 →
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-ink-100 text-ink-700 font-black"
              aria-label="닫기"
            >
              ✕
            </button>
          </div>
        </header>
        <ol className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {group.bookIds.map((id, i) => {
            const b = books.find((x) => x.id === id);
            const cover = b?.coverImage;
            return (
              <li key={id} className="rounded-2xl border border-ink-100 p-2 bg-cream-50">
                <div className="aspect-video rounded-xl overflow-hidden bg-ink-100">
                  {cover && <img src={cover} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="mt-2 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-ink-900 break-keep">
                      {i + 1}. {b?.title ?? `(없는 책 ${id})`}
                    </p>
                    <p className="text-xs text-ink-500">
                      {b ? (b.isPublic ? '공개' : '비공개') : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => onRemove(id)}
                    className="shrink-0 px-2 py-1 rounded-lg bg-ink-100 text-ink-600 text-xs font-black hover:bg-ink-200"
                    title="이 책을 그룹에서 빼기"
                  >
                    빼기
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
