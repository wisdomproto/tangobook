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
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useStorybooks } from '@/features/storybook';
import { useLibraryConfig, useUpdateLibraryConfig } from '@/features/library';
import { storybookApi } from '@/features/storybook';
import { useQueryClient } from '@tanstack/react-query';
import type { LibraryConfig, StorybookSummary } from '@tangobook/shared';

/** LibraryPage 의 default priority — config 비어있을 때 fallback. */
const DEFAULT_CATEGORY_ORDER = ['세계 명작', '자연 관찰', '생활 동화', '전래 동화', '기타'];

const CATEGORY_EMOJI: Record<string, string> = {
  '세계 명작': '🌟',
  '자연 관찰': '🌿',
  '생활 동화': '👨‍👩‍👧',
  '전래 동화': '📜',
  기타: '📚',
};

function categoryEmoji(cat: string): string {
  return CATEGORY_EMOJI[cat] ?? '📚';
}

/** 책 → 활용 가능 카테고리 set 추출 (실 데이터에 존재하는 카테고리만). */
function deriveAllCategories(books: StorybookSummary[]): string[] {
  const set = new Set<string>();
  books.forEach((b) => {
    if (!b.isPublic) return;
    if (b.type && b.type !== 'storybook') return;
    set.add(b.category || '기타');
  });
  return [...set];
}

/** config + 실 카테고리 merge — config 순서 우선, 누락된건 default 순서로 append. */
function mergeCategoryOrder(configOrder: string[] | undefined, allCats: string[]): string[] {
  const ordered: string[] = [];
  (configOrder ?? []).forEach((c) => {
    if (allCats.includes(c) && !ordered.includes(c)) ordered.push(c);
  });
  // config 에 없지만 default priority 에 있는 것 먼저
  DEFAULT_CATEGORY_ORDER.forEach((c) => {
    if (allCats.includes(c) && !ordered.includes(c)) ordered.push(c);
  });
  // 그 외 카테고리 (이름순)
  allCats
    .filter((c) => !ordered.includes(c))
    .sort()
    .forEach((c) => ordered.push(c));
  return ordered;
}

/** 카테고리에 속한 책 list 정렬 — config priority 우선, 누락은 createdAt desc append. */
function orderBooksInCategory(
  cat: string,
  books: StorybookSummary[],
  bookPriority: Record<string, string[]> | undefined
): StorybookSummary[] {
  const pool = books.filter(
    (b) => b.isPublic && (!b.type || b.type === 'storybook') && (b.category || '기타') === cat
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

/** 책의 메인 표지 URL — defaultStyle 의 표지 우선, 없으면 coverImage. */
function pickCoverUrl(b: StorybookSummary): string | undefined {
  // StorybookSummary 는 coverImage 만 있고 styleAssets 별 표지는 server 에서 이미 picked.
  // server 가 defaultStyle 우선해서 coverImage 채우므로 그대로 사용.
  return b.coverImage;
}

export default function LibraryMasterPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: storybooks, isLoading } = useStorybooks();
  const { data: config } = useLibraryConfig();
  const update = useUpdateLibraryConfig();

  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [coverModalBookId, setCoverModalBookId] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  const allCategories = useMemo(
    () => (storybooks ? deriveAllCategories(storybooks) : []),
    [storybooks]
  );
  const categoryOrder = useMemo(
    () => mergeCategoryOrder(config?.categoryOrder, allCategories),
    [config?.categoryOrder, allCategories]
  );

  // 첫 로드 시 첫 카테고리 자동 선택
  useEffect(() => {
    if (!activeCat && categoryOrder.length > 0) setActiveCat(categoryOrder[0]);
  }, [categoryOrder, activeCat]);

  // 활성 카테고리 책
  const activeBooks = useMemo(() => {
    if (!storybooks || !activeCat) return [];
    return orderBooksInCategory(activeCat, storybooks, config?.bookPriority);
  }, [storybooks, activeCat, config?.bookPriority]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const flashSaved = () => {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  };

  const persistConfig = (next: LibraryConfig) => {
    update.mutate(next, { onSuccess: () => flashSaved() });
  };

  // 카테고리 reorder
  const handleCategoryDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = categoryOrder.indexOf(String(active.id));
    const newIdx = categoryOrder.indexOf(String(over.id));
    if (oldIdx < 0 || newIdx < 0) return;
    const next = arrayMove(categoryOrder, oldIdx, newIdx);
    persistConfig({ ...(config ?? {}), categoryOrder: next });
  };

  // 책 reorder (활성 카테고리 안에서만)
  const handleBookDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id || !activeCat) return;
    const ids = activeBooks.map((b) => b.id);
    const oldIdx = ids.indexOf(String(active.id));
    const newIdx = ids.indexOf(String(over.id));
    if (oldIdx < 0 || newIdx < 0) return;
    const nextIds = arrayMove(ids, oldIdx, newIdx);
    const nextPriority = { ...(config?.bookPriority ?? {}), [activeCat]: nextIds };
    persistConfig({ ...(config ?? {}), bookPriority: nextPriority });
  };

  // 표지 변경 — 책의 defaultStyle 변경 후 storybook 저장 + storybooks list invalidate
  const handleChangeCover = async (bookId: string, newStyleId: string) => {
    try {
      const sb = await storybookApi.getById(bookId);
      const updated = { ...sb, defaultStyle: newStyleId };
      await storybookApi.save(updated);
      await qc.invalidateQueries({ queryKey: ['storybooks'] });
      flashSaved();
      setCoverModalBookId(null);
    } catch (err) {
      alert(`표지 변경 실패: ${(err as Error).message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 to-peach-100">
      {/* 상단 헤더 — 흰 wash 카드 */}
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
          <div className="flex items-center gap-3">
            {savedFlash && (
              <span className="text-success font-black text-sm animate-pulse">✓ 저장됨</span>
            )}
            {update.isPending && <span className="text-ink-500 text-sm">저장 중...</span>}
          </div>
        </div>
        <div className="max-w-[1480px] mx-auto px-6 pb-3 text-sm text-ink-600">
          좌측 카테고리를 끌어 순서를 바꾸고, 우측 책을 끌어 라이브러리 노출 순서를 정합니다. 변경
          즉시 자동 저장돼요.
        </div>
      </header>

      <div className="max-w-[1480px] mx-auto px-6 py-6">
        {isLoading ? (
          <div className="text-center py-20 text-ink-500">불러오는 중...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
            {/* 좌측: 카테고리 패널 */}
            <section className="bg-white rounded-3xl shadow-soft p-4 lg:sticky lg:top-32 lg:self-start">
              <h2 className="text-lg font-black text-ink-900 px-2 pb-3 flex items-center justify-between">
                <span>카테고리 ({categoryOrder.length})</span>
              </h2>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleCategoryDragEnd}
              >
                <SortableContext items={categoryOrder} strategy={verticalListSortingStrategy}>
                  <div className="flex flex-col gap-2">
                    {categoryOrder.map((cat) => {
                      const count =
                        storybooks?.filter(
                          (b) =>
                            b.isPublic &&
                            (!b.type || b.type === 'storybook') &&
                            (b.category || '기타') === cat
                        ).length ?? 0;
                      return (
                        <SortableCategoryRow
                          key={cat}
                          id={cat}
                          label={cat}
                          count={count}
                          active={cat === activeCat}
                          onClick={() => setActiveCat(cat)}
                        />
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            </section>

            {/* 우측: 책 패널 */}
            <section className="bg-white rounded-3xl shadow-soft p-5">
              {activeCat ? (
                <>
                  <header className="flex items-center justify-between mb-4 px-1">
                    <h2 className="text-2xl font-black text-ink-900 font-display flex items-center gap-2">
                      <span>{categoryEmoji(activeCat)}</span>
                      <span>{activeCat}</span>
                      <span className="text-base text-ink-500 font-bold">
                        ({activeBooks.length}권)
                      </span>
                    </h2>
                  </header>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleBookDragEnd}
                  >
                    <SortableContext
                      items={activeBooks.map((b) => b.id)}
                      strategy={rectSortingStrategy}
                    >
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                        {activeBooks.map((book, idx) => (
                          <SortableBookCard
                            key={book.id}
                            book={book}
                            index={idx}
                            onChangeCover={() => setCoverModalBookId(book.id)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </>
              ) : (
                <div className="text-center py-20 text-ink-500">카테고리를 선택해주세요</div>
              )}
            </section>
          </div>
        )}
      </div>

      {coverModalBookId && (
        <CoverPickerModal
          bookId={coverModalBookId}
          onClose={() => setCoverModalBookId(null)}
          onPick={(styleId) => handleChangeCover(coverModalBookId, styleId)}
        />
      )}
    </div>
  );
}

// =============== Sortable rows ===============

function SortableCategoryRow({
  id,
  label,
  count,
  active,
  onClick,
}: {
  id: string;
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded-xl border-2 transition ${
        active
          ? 'bg-coral-50 border-coral-300 shadow-soft'
          : 'bg-cream-50 border-transparent hover:bg-cream-100'
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="px-2 py-3 cursor-grab active:cursor-grabbing text-ink-400 hover:text-ink-700"
        aria-label="순서 변경"
      >
        ≡
      </button>
      <button
        onClick={onClick}
        className="flex-1 flex items-center justify-between px-1 py-3 text-left"
      >
        <span className="flex items-center gap-2">
          <span className="text-xl">{categoryEmoji(label)}</span>
          <span className={`font-black ${active ? 'text-coral-700' : 'text-ink-900'}`}>
            {label}
          </span>
        </span>
        <span className="text-sm text-ink-500 font-bold pr-2">{count}</span>
      </button>
    </div>
  );
}

function SortableBookCard({
  book,
  index,
  onChangeCover,
}: {
  book: StorybookSummary;
  index: number;
  onChangeCover: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: book.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  };
  const cover = pickCoverUrl(book);
  const styleCount = book.coversByStyle ? Object.keys(book.coversByStyle).length : 0;
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group relative rounded-2xl bg-cream-50 hover:bg-cream-100 transition cursor-grab active:cursor-grabbing overflow-hidden border-2 border-transparent hover:border-coral-300 select-none"
    >
      <span className="absolute top-2 left-2 z-10 bg-white/90 text-ink-900 text-xs font-black tabular-nums rounded-full w-7 h-7 flex items-center justify-center shadow-soft">
        {index + 1}
      </span>
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={onChangeCover}
        disabled={styleCount < 2}
        className="absolute top-2 right-2 z-10 px-2 py-1 rounded-full bg-coral-500 text-white text-xs font-black shadow-soft hover:bg-coral-600 disabled:opacity-40 disabled:cursor-not-allowed"
        title={styleCount < 2 ? '그림체가 1종이라 변경 불가' : '메인 표지 변경'}
        aria-label="메인 표지 변경"
      >
        🎨
      </button>
      <div className="aspect-[3/4] bg-peach-100 overflow-hidden">
        {cover ? (
          <img
            src={cover}
            alt={book.title}
            className="w-full h-full object-cover pointer-events-none"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">📖</div>
        )}
      </div>
      <div className="px-2.5 py-2">
        <div className="font-black text-ink-900 text-sm truncate">{book.title}</div>
        <div className="text-[11px] text-ink-500 mt-0.5">그림체 {styleCount}종</div>
      </div>
    </div>
  );
}

// =============== Cover picker modal ===============

function CoverPickerModal({
  bookId,
  onClose,
  onPick,
}: {
  bookId: string;
  onClose: () => void;
  onPick: (styleId: string) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    title: string;
    defaultStyle?: string;
    options: Array<{ styleId: string; imageUrl: string }>;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const sb = await storybookApi.getById(bookId);
        if (cancelled) return;
        const opts: Array<{ styleId: string; imageUrl: string }> = [];
        // styleAssets 의 각 그림체에서 표지 추출
        if (sb.styleAssets) {
          for (const [styleId, assets] of Object.entries(sb.styleAssets)) {
            const url =
              assets?.primaryCoverByLang?.ko ??
              assets?.coverImage ??
              assets?.coverImages?.[0]?.imageUrl;
            if (url) opts.push({ styleId, imageUrl: url });
          }
        }
        // 그림체 정보 없는 legacy 책 — top-level cover 만 fallback
        if (opts.length === 0 && sb.coverImage) {
          opts.push({ styleId: sb.artStyle || 'default', imageUrl: sb.coverImage });
        }
        setData({
          title: sb.title,
          defaultStyle: sb.defaultStyle ?? sb.artStyle,
          options: opts,
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bookId]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sticky top-0 bg-white border-b border-ink-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-black text-ink-900 truncate">
            🎨 메인 표지 선택{data ? ` — ${data.title}` : ''}
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-ink-100 hover:bg-ink-200 text-ink-700 font-black"
            aria-label="닫기"
          >
            ✕
          </button>
        </header>
        <div className="p-6">
          {loading ? (
            <div className="text-center py-20 text-ink-500">불러오는 중...</div>
          ) : !data || data.options.length === 0 ? (
            <div className="text-center py-20 text-ink-500">사용 가능한 표지가 없습니다.</div>
          ) : (
            <>
              <p className="text-sm text-ink-600 mb-4">
                그림체를 클릭하면 라이브러리 카드에 그 그림체의 표지가 노출됩니다.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {data.options.map((opt) => {
                  const isCurrent = opt.styleId === data.defaultStyle;
                  return (
                    <button
                      key={opt.styleId}
                      onClick={() => onPick(opt.styleId)}
                      className={`relative aspect-square rounded-2xl overflow-hidden border-4 transition hover:scale-[1.02] ${
                        isCurrent
                          ? 'border-coral-500 ring-4 ring-coral-200'
                          : 'border-ink-100 hover:border-coral-300'
                      }`}
                    >
                      <img
                        src={opt.imageUrl}
                        alt={opt.styleId}
                        className="w-full h-full object-cover"
                      />
                      {isCurrent && (
                        <span className="absolute top-2 right-2 bg-coral-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-black shadow-pop">
                          ✓
                        </span>
                      )}
                      <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-xs font-black px-2 py-1.5 truncate">
                        {opt.styleId}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
