import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CollectionStatus } from '@tangobook/shared';
import { useStorybooks } from '@/features/storybook';
import { useCollectionCatalog } from '../hooks/useCollectionCatalog';
import { useStorybookCardIndex } from '../hooks/useCollectionCatalog';
import { useCollectionUserState } from '../hooks/useCollectionUserState';
import { Skeleton } from '@/design-system';

interface BookGroupSummary {
  bookId: string;
  title: string;
  category?: string;
  coverImage?: string;
  totalCards: number;
  ownedCards: number;
  activeCards: number;
}

const PRIORITY_CATEGORIES = [
  '세계 명작',
  '명작동화',
  '생활동화',
  '자연관찰',
  '한국 전래',
  '전래동화',
];

/** 도감 동화별 view — 책별 카드 모음 진척 그리드. 책 카드 클릭 → 책 페이지 회귀. */
export function CollectionByBookView() {
  const navigate = useNavigate();
  const { data: catalog, isLoading: catalogLoading } = useCollectionCatalog();
  const { data: bookCardIndex } = useStorybookCardIndex();
  const { data: storybooks, isLoading: booksLoading } = useStorybooks();
  const { statusMap } = useCollectionUserState();

  const isLoading = catalogLoading || booksLoading;

  const groups = useMemo(() => {
    if (!catalog || !bookCardIndex || !storybooks) return [];

    const cardById = new Map(catalog.items.map((c) => [c.id, c]));
    const groupsByCategory = new Map<string, BookGroupSummary[]>();

    for (const book of storybooks) {
      if (!book.isPublic) continue;
      const cardIds = bookCardIndex[book.id] ?? [];
      if (cardIds.length === 0) continue; // 카드 매핑 없는 책은 도감 view 에 노출 X
      let owned = 0;
      let active = 0;
      for (const cid of cardIds) {
        if (!cardById.has(cid)) continue;
        const status: CollectionStatus = statusMap.get(cid) ?? 'locked';
        if (status === 'owned' || status === 'active') owned += 1;
        if (status === 'active') active += 1;
      }
      const summary: BookGroupSummary = {
        bookId: book.id,
        title: book.title,
        category: book.category,
        coverImage: book.coverImage,
        totalCards: cardIds.length,
        ownedCards: owned,
        activeCards: active,
      };
      const cat = book.category ?? '기타';
      const arr = groupsByCategory.get(cat) ?? [];
      arr.push(summary);
      groupsByCategory.set(cat, arr);
    }

    const orderedCats = Array.from(groupsByCategory.keys()).sort((a, b) => {
      const ai = PRIORITY_CATEGORIES.findIndex((p) => a.includes(p));
      const bi = PRIORITY_CATEGORIES.findIndex((p) => b.includes(p));
      const aIdx = ai === -1 ? 999 : ai;
      const bIdx = bi === -1 ? 999 : bi;
      if (aIdx !== bIdx) return aIdx - bIdx;
      return a.localeCompare(b, 'ko');
    });

    // 카테고리 안에서 — 카드 진척 높은 책 먼저
    return orderedCats.map((cat) => ({
      cat,
      books: (groupsByCategory.get(cat) ?? []).sort(
        (a, b) =>
          b.ownedCards / Math.max(b.totalCards, 1) - a.ownedCards / Math.max(a.totalCards, 1)
      ),
    }));
  }, [catalog, bookCardIndex, storybooks, statusMap]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
        ))}
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="text-center py-16 text-ink-500">
        <p className="text-lg font-bold">아직 책별 카드가 준비되지 않았어요</p>
        <p className="text-sm mt-1">동화를 읽으면 카드가 모여요!</p>
      </div>
    );
  }

  return (
    <>
      {groups.map((g) => (
        <section key={g.cat} className="mb-8">
          <h2 className="text-xl md:text-2xl font-black font-display text-ink-900 dark:text-peach-100 mb-3 flex items-center gap-2">
            <span>📖</span>
            <span>{g.cat}</span>
            <span className="text-sm font-bold text-ink-400">({g.books.length}권)</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {g.books.map((b) => {
              const completion = b.totalCards > 0 ? b.ownedCards / b.totalCards : 0;
              return (
                <button
                  key={b.bookId}
                  onClick={() => navigate(`/library/${b.bookId}`)}
                  className="group relative aspect-[3/4] rounded-2xl bg-white shadow-soft border-2 border-transparent overflow-hidden hover:shadow-pop hover:-translate-y-1 hover:border-coral-200 transition-all"
                  title={`${b.title} — ${b.ownedCards}/${b.totalCards} 카드 모음`}
                >
                  {b.coverImage ? (
                    <img
                      src={b.coverImage}
                      alt=""
                      aria-hidden
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-peach-100 to-coral-100/40" />
                  )}
                  {/* 가독성 그라데이션 */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent p-3 pt-8">
                    <div className="text-white font-black text-sm sm:text-base line-clamp-2 leading-tight drop-shadow">
                      {b.title}
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <div className="flex-1 h-1.5 bg-white/30 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-coral-300 to-coral-500 transition-all"
                          style={{ width: `${completion * 100}%` }}
                        />
                      </div>
                      <span className="text-cream-100 text-[11px] font-bold whitespace-nowrap">
                        {b.ownedCards}/{b.totalCards}
                      </span>
                    </div>
                  </div>
                  {b.activeCards > 0 && (
                    <div className="absolute top-2 right-2 text-xs font-black text-success bg-white/90 px-2 py-0.5 rounded-full border border-success/30 shadow-sm">
                      ✨{b.activeCards}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}
