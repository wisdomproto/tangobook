import { Link, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { COLLECTION_CATEGORIES, type CollectionCategoryId } from '@tangobook/shared';
import { useCollectionCatalog } from '../hooks/useCollectionCatalog';
import { useCollectionUserState } from '../hooks/useCollectionUserState';
import { Skeleton, Mascot } from '@/design-system';
import { CollectionByBookView } from './CollectionByBookView';

type ViewMode = 'category' | 'book';

interface CategoryStats {
  total: number;
  owned: number;
  active: number;
  previewUrl?: string; // 카테고리 대표 표지 (첫 카드 이미지)
}

export function CollectionPage() {
  const navigate = useNavigate();
  const { data: catalog, isLoading } = useCollectionCatalog();
  const { statusMap } = useCollectionUserState();
  const [viewMode, setViewMode] = useState<ViewMode>('category');

  // 카테고리별 진척률 집계
  const stats = useMemo(() => {
    const map = new Map<CollectionCategoryId, CategoryStats>();
    for (const cat of COLLECTION_CATEGORIES) {
      map.set(cat.id, { total: 0, owned: 0, active: 0 });
    }
    for (const item of catalog?.items ?? []) {
      const s = map.get(item.category);
      if (!s) continue;
      s.total += 1;
      if (!s.previewUrl && item.imageUrl) s.previewUrl = item.imageUrl;
      const status = statusMap.get(item.id) ?? 'locked';
      if (status === 'owned' || status === 'active') s.owned += 1;
      if (status === 'active') s.active += 1;
    }
    return map;
  }, [catalog, statusMap]);

  const totalCards = catalog?.items.length ?? 0;
  const ownedTotal = useMemo(() => {
    let n = 0;
    for (const item of catalog?.items ?? []) {
      const status = statusMap.get(item.id);
      if (status === 'owned' || status === 'active') n += 1;
    }
    return n;
  }, [catalog, statusMap]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 via-peach-100 to-coral-100/30 dark:from-darkbg dark:via-slate-900 dark:to-slate-900">
      {/* 헤더 */}
      <header className="px-6 pt-6 pb-4 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/library')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-soft text-ink-700 font-bold hover:shadow-pop transition"
          >
            ← 돌아가기
          </button>
          <Link
            to="/library"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-soft text-ink-700 font-bold hover:shadow-pop transition"
          >
            🏠 홈
          </Link>
        </div>
        <div className="text-center">
          <div className="inline-flex items-center gap-3 mb-2">
            <Mascot state="celebrating" size="md" />
            <h1 className="text-3xl md:text-4xl font-black font-display text-ink-900 dark:text-peach-100">
              내 카드 도감
            </h1>
          </div>
          <p className="text-ink-700 dark:text-peach-200 font-bold">
            동화를 읽으면 카드가 모이고, 게임을 풀면 도감이 살아나요!
          </p>
          {totalCards > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white shadow-soft border border-coral-200">
              <span className="text-coral-500 font-black text-lg">{ownedTotal}</span>
              <span className="text-ink-700">/</span>
              <span className="text-ink-700">{totalCards}</span>
              <span className="text-sm text-ink-500 ml-1">장 모음</span>
            </div>
          )}
        </div>
      </header>

      {/* View toggle (📂 카테고리 / 📖 동화별) */}
      <div className="px-6 max-w-6xl mx-auto mb-4 flex justify-center">
        <div className="inline-flex bg-white rounded-full shadow-soft border border-coral-200 p-1">
          <button
            onClick={() => setViewMode('category')}
            className={`px-5 py-2 rounded-full text-sm font-black transition-all ${
              viewMode === 'category'
                ? 'bg-coral-500 text-white shadow-pop'
                : 'text-ink-700 hover:bg-coral-50'
            }`}
          >
            📂 카테고리별
          </button>
          <button
            onClick={() => setViewMode('book')}
            className={`px-5 py-2 rounded-full text-sm font-black transition-all ${
              viewMode === 'book'
                ? 'bg-coral-500 text-white shadow-pop'
                : 'text-ink-700 hover:bg-coral-50'
            }`}
          >
            📖 동화별
          </button>
        </div>
      </div>

      {/* 본문 — view mode 별 분기 */}
      <main className="px-6 pb-12 max-w-6xl mx-auto">
        {viewMode === 'book' ? (
          <CollectionByBookView />
        ) : isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {COLLECTION_CATEGORIES.map((cat) => {
              const s = stats.get(cat.id) ?? { total: 0, owned: 0, active: 0 };
              const empty = s.total === 0;
              const completion = s.total > 0 ? s.owned / s.total : 0;
              return (
                <button
                  key={cat.id}
                  onClick={() => navigate(`/collection/${cat.id}`)}
                  disabled={empty}
                  className={`group relative aspect-[3/4] rounded-2xl bg-white shadow-soft border-2 border-transparent overflow-hidden transition-all
                    ${empty ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-pop hover:-translate-y-1 hover:border-coral-200 active:translate-y-0'}`}
                >
                  {/* 대표 표지 (살짝 흐리게 깔아 빈 느낌 제거) */}
                  {s.previewUrl ? (
                    <img
                      src={s.previewUrl}
                      alt=""
                      aria-hidden
                      className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-peach-100 via-cream-50 to-coral-100/40 dark:from-slate-800 dark:to-slate-700" />
                  )}
                  {/* 가독성 위한 화이트 그라데이션 오버레이 */}
                  {s.previewUrl && (
                    <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/40 to-white/80 dark:from-slate-900/60 dark:to-slate-900/80" />
                  )}
                  <div className="relative h-full flex flex-col items-center justify-center gap-2 p-4">
                    <div className="text-6xl drop-shadow-sm">{cat.emoji}</div>
                    <div className="text-lg font-black text-ink-900 dark:text-peach-100 font-display drop-shadow-sm">
                      {cat.nameKo}
                    </div>
                    {empty ? (
                      <div className="text-xs text-ink-500 font-bold">곧 만나요!</div>
                    ) : (
                      <>
                        <div className="text-xs text-ink-700 font-bold drop-shadow-sm">
                          {s.owned} / {s.total} 장
                        </div>
                        {/* 진척률 바 */}
                        <div className="w-full h-1.5 bg-white/70 rounded-full overflow-hidden border border-ink-100">
                          <div
                            className="h-full bg-gradient-to-r from-coral-400 to-coral-500 transition-all"
                            style={{ width: `${completion * 100}%` }}
                          />
                        </div>
                        {s.active > 0 && (
                          <div className="absolute top-2 right-2 text-xs font-black text-success bg-success/10 px-2 py-0.5 rounded-full border border-success/30">
                            ✨{s.active}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* 빈 상태 안내 */}
        {!isLoading && totalCards === 0 && (
          <div className="mt-8 text-center text-ink-500">
            <p className="text-sm">아직 카드 콜렉션이 준비 중이에요. 곧 만나요!</p>
          </div>
        )}
      </main>
    </div>
  );
}
