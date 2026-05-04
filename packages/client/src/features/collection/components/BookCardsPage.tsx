import { useNavigate, useParams } from 'react-router-dom';
import { useMemo, useState } from 'react';
import type { CollectionItem } from '@tangobook/shared';
import { useStorybook } from '@/features/storybook';
import { useCollectionCatalog, useStorybookCardIndex } from '../hooks/useCollectionCatalog';
import { useCollectionUserState } from '../hooks/useCollectionUserState';
import { Skeleton, Mascot, StateScreen } from '@/design-system';
import { CardDetailModal } from './CardDetailModal';
import { CardSlot } from './CardSlot';

/**
 * 도감 동화별 view 의 책 클릭 → 그 책의 핵심단어 카드 grid.
 *
 * URL: `/collection/book/:bookId`
 *
 * 흐름:
 * - useStorybook 으로 책 정보 (title, coverImage)
 * - useStorybookCardIndex 로 그 책에서 추출된 카드 ID 들
 * - useCollectionCatalog 에서 해당 카드 entry 조회
 * - CardSlot grid + CardDetailModal
 */
export function BookCardsPage() {
  const { bookId = '' } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const [openItem, setOpenItem] = useState<CollectionItem | null>(null);

  const { data: book, isLoading: bookLoading } = useStorybook(bookId);
  const { data: catalog, isLoading: catalogLoading } = useCollectionCatalog();
  const { data: bookCardIndex } = useStorybookCardIndex();
  const { statusMap } = useCollectionUserState();

  const items = useMemo<CollectionItem[]>(() => {
    if (!catalog || !bookCardIndex) return [];
    const cardIds = bookCardIndex[bookId] ?? [];
    const byId = new Map(catalog.items.map((c) => [c.id, c]));
    return cardIds.map((id) => byId.get(id)).filter((c): c is CollectionItem => c != null);
  }, [catalog, bookCardIndex, bookId]);

  const ownedCount = items.filter((i) => {
    const s = statusMap.get(i.id) ?? 'locked';
    return s === 'owned' || s === 'active';
  }).length;
  const activeCount = items.filter((i) => statusMap.get(i.id) === 'active').length;

  const isLoading = bookLoading || catalogLoading;

  if (!isLoading && !book) {
    return (
      <StateScreen
        mascotState="sad"
        title="이 책을 찾을 수 없어"
        action={{ label: '🃏 도감으로', onClick: () => navigate('/collection') }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 via-peach-100 to-coral-100/30 dark:from-darkbg dark:via-slate-900 dark:to-slate-900">
      {/* 헤더 한 줄 — 사이드바에 이미 홈/탱고북 있어 홈 제거. ← 만 도감 메인으로. */}
      <header className="px-4 sm:px-6 pt-3 pb-2 max-w-6xl mx-auto">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => navigate('/collection')}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white shadow-soft text-ink-700 text-sm font-bold hover:shadow-pop transition shrink-0"
            title="카드 도감으로"
          >
            ←
          </button>
          <Mascot state="reading" size="sm" character="hori" />
          <h1 className="text-lg sm:text-xl font-black font-display text-ink-900 dark:text-peach-100 truncate">
            📖 {book?.title ?? '...'}
          </h1>
          {!isLoading && items.length > 0 && (
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white shadow-soft border border-coral-200 whitespace-nowrap">
              <span className="text-coral-500 font-black text-sm">{ownedCount}</span>
              <span className="text-ink-500 text-xs">/</span>
              <span className="text-ink-700 text-xs font-bold">{items.length}</span>
              <span className="text-[11px] text-ink-500 ml-1">카드</span>
              {activeCount > 0 && (
                <span className="ml-1 text-success font-black text-xs">✨{activeCount}</span>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="px-6 pb-12 max-w-6xl mx-auto">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-ink-500">
            <p className="text-lg font-bold">이 책에는 아직 카드가 매핑되지 않았어요</p>
            <p className="text-sm mt-1">동화를 한 번 읽으면 자동으로 모여요!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {items.map((item) => {
              const status = statusMap.get(item.id) ?? 'locked';
              return (
                <CardSlot
                  key={item.id}
                  item={item}
                  status={status}
                  onClick={() => setOpenItem(item)}
                />
              );
            })}
          </div>
        )}
      </main>

      <CardDetailModal
        item={openItem}
        status={openItem ? (statusMap.get(openItem.id) ?? 'locked') : 'locked'}
        onClose={() => setOpenItem(null)}
      />
    </div>
  );
}
