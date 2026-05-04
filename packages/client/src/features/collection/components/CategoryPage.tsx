import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import {
  COLLECTION_CATEGORIES,
  type CollectionCategoryId,
  type CollectionItem,
} from '@tangobook/shared';
import { useCollectionCatalog } from '../hooks/useCollectionCatalog';
import { useCollectionUserState } from '../hooks/useCollectionUserState';
import { Skeleton } from '@/design-system';
import { CardDetailModal } from './CardDetailModal';
import { CardSlot } from './CardSlot';

const CATEGORY_BG: Record<CollectionCategoryId, string> = {
  animal: 'from-orange-50 to-yellow-100',
  food: 'from-rose-50 to-red-100',
  'magic-object': 'from-violet-50 to-purple-100',
  people: 'from-amber-50 to-orange-100',
  nature: 'from-emerald-50 to-green-100',
  home: 'from-sky-50 to-blue-100',
};

export function CategoryPage() {
  const { categoryId } = useParams<{ categoryId: CollectionCategoryId }>();
  const navigate = useNavigate();
  const [openItem, setOpenItem] = useState<CollectionItem | null>(null);

  const cat = COLLECTION_CATEGORIES.find((c) => c.id === categoryId);
  if (!cat) return <Navigate to="/collection" replace />;

  const { data: catalog, isLoading } = useCollectionCatalog();
  const { statusMap } = useCollectionUserState();

  const items = useMemo(
    () => catalog?.items.filter((i) => i.category === categoryId) ?? [],
    [catalog, categoryId]
  );

  const ownedCount = items.filter((i) => {
    const s = statusMap.get(i.id) ?? 'locked';
    return s === 'owned' || s === 'active';
  }).length;
  const activeCount = items.filter((i) => statusMap.get(i.id) === 'active').length;

  return (
    <div
      className={`min-h-screen bg-gradient-to-b ${CATEGORY_BG[cat.id]} dark:from-darkbg dark:to-slate-900`}
    >
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
          <span className="text-3xl sm:text-4xl" aria-hidden>
            {cat.emoji}
          </span>
          <h1 className="text-lg sm:text-xl font-black font-display text-ink-900 dark:text-peach-100 whitespace-nowrap">
            {cat.nameKo}
          </h1>
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white shadow-soft border border-coral-200 whitespace-nowrap">
            <span className="text-coral-500 font-black text-sm">{ownedCount}</span>
            <span className="text-ink-500 text-xs">/</span>
            <span className="text-ink-700 text-xs font-bold">{items.length}</span>
            {activeCount > 0 && (
              <span className="ml-1 text-success font-black text-xs">✨{activeCount}</span>
            )}
          </div>
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
            <p className="text-lg font-bold">아직 카드가 준비 중이에요</p>
            <p className="text-sm mt-1">곧 만나요!</p>
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
