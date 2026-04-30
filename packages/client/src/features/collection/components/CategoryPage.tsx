import { useNavigate, useParams, Link, Navigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import {
  COLLECTION_CATEGORIES,
  type CollectionCategoryId,
  type CollectionItem,
  type CollectionStatus,
} from '@tangobook/shared';
import { useCollectionCatalog } from '../hooks/useCollectionCatalog';
import { useCollectionUserState } from '../hooks/useCollectionUserState';
import { Skeleton } from '@/design-system';
import { CardDetailModal } from './CardDetailModal';

const CATEGORY_BG: Record<CollectionCategoryId, string> = {
  classic: 'from-amber-50 to-orange-100',
  folktale: 'from-rose-50 to-red-100',
  animal: 'from-orange-50 to-yellow-100',
  dinosaur: 'from-emerald-50 to-green-100',
  plant: 'from-pink-50 to-rose-100',
  ocean: 'from-sky-50 to-blue-100',
  space: 'from-indigo-50 to-purple-100',
  life: 'from-teal-50 to-cyan-100',
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
      <header className="px-6 pt-6 pb-4 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/collection')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-soft text-ink-700 font-bold hover:shadow-pop transition"
          >
            ← 카드 도감
          </button>
          <Link
            to="/library"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-soft text-ink-700 font-bold hover:shadow-pop transition"
          >
            🏠 홈
          </Link>
        </div>

        <div className="text-center">
          <div className="text-7xl mb-2" aria-hidden>
            {cat.emoji}
          </div>
          <h1 className="text-3xl md:text-4xl font-black font-display text-ink-900 dark:text-peach-100">
            {cat.nameKo}
          </h1>
          <div className="mt-3 inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white shadow-soft border border-coral-200">
            <span className="text-coral-500 font-black text-lg">{ownedCount}</span>
            <span className="text-ink-700">/</span>
            <span className="text-ink-700 font-bold">{items.length}</span>
            <span className="text-sm text-ink-500 ml-1">장</span>
            {activeCount > 0 && (
              <span className="ml-2 text-success font-black text-sm">✨ {activeCount}</span>
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

interface CardSlotProps {
  item: CollectionItem;
  status: CollectionStatus;
  onClick: () => void;
}

function CardSlot({ item, status, onClick }: CardSlotProps) {
  const isLocked = status === 'locked';
  const isSilhouette = status === 'silhouette';
  const isOwned = status === 'owned';
  const isActive = status === 'active';

  return (
    <button
      onClick={onClick}
      className={`group relative aspect-[3/4] rounded-2xl bg-white shadow-soft overflow-hidden transition-all
        ${isActive ? 'ring-2 ring-success shadow-pop' : ''}
        hover:-translate-y-1 hover:shadow-pop active:translate-y-0`}
    >
      {/* 표지 이미지 — 4단계별 효과:
          locked: 진한 grayscale + 어둡게 + 흐림 (실루엣처럼)
          silhouette: grayscale + 살짝 어둡게
          owned: 풀컬러
          active: 풀컬러 + ring */}
      <img
        src={item.imageUrl}
        alt=""
        aria-hidden
        className={`absolute inset-0 w-full h-full object-cover transition-all
          ${
            isLocked
              ? 'grayscale brightness-50 opacity-40 blur-[1px]'
              : isSilhouette
                ? 'grayscale brightness-75 opacity-80'
                : ''
          }`}
        loading="lazy"
      />

      {/* 잠금 자물쇠 오버레이 */}
      {isLocked && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-5xl opacity-70 drop-shadow-md" aria-hidden>
            🔒
          </span>
        </div>
      )}

      {/* 카드 이름 라벨 */}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
        <div
          className={`text-white text-xs md:text-sm font-black text-center font-display drop-shadow-md line-clamp-2 ${isLocked ? 'opacity-70' : ''}`}
        >
          {isLocked ? '???' : item.nameKo}
        </div>
      </div>

      {/* active ✨ 뱃지 */}
      {isActive && (
        <div className="absolute top-2 right-2 bg-success text-white px-2 py-0.5 rounded-full text-xs font-black shadow-pop">
          ✨ 활성!
        </div>
      )}

      {/* foil 별표 — Phase 3 후속 */}
      {item.rarity === 'foil' && (
        <div className="absolute top-2 left-2 text-yellow-400 text-lg drop-shadow-md">★</div>
      )}
    </button>
  );
}
