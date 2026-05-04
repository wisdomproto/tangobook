import { useNavigate } from 'react-router-dom';
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
}
// NOTE: previewUrl(카테고리 대표 표지) 제거 — "그 카테고리 첫 카드 imageUrl" 로직이
// 헨젤과 그레텔처럼 KeyObject 가 다 카테고리에 분포한 책에서는 같은 표지가 3 카테고리에
// 박히는 문제. 통일 그라데이션 + 큰 emoji 로 단순화.
// TODO: 향후 카테고리별 디자이너 일러스트 6장 (image-backlog.md 참조).

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
      {/* 헤더 — 한 줄 압축. 사이드바에 이미 홈/탱고북 있어 돌아가기·홈 버튼 제거. */}
      <header className="px-4 sm:px-6 pt-3 pb-2 max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Mascot state="celebrating" size="sm" />
            <h1 className="text-lg sm:text-xl font-black font-display text-ink-900 dark:text-peach-100 whitespace-nowrap">
              카드 도감
            </h1>
            {totalCards > 0 && (
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white shadow-soft border border-coral-200 whitespace-nowrap">
                <span className="text-coral-500 font-black text-sm">{ownedTotal}</span>
                <span className="text-ink-500 text-xs">/</span>
                <span className="text-ink-700 text-xs font-bold">{totalCards}</span>
              </div>
            )}
          </div>

          <div className="inline-flex bg-white rounded-full shadow-soft border border-coral-200 p-0.5 shrink-0">
            <button
              onClick={() => setViewMode('category')}
              className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-black transition-all ${
                viewMode === 'category'
                  ? 'bg-coral-500 text-white shadow-pop'
                  : 'text-ink-700 hover:bg-coral-50'
              }`}
            >
              📂 카테고리
            </button>
            <button
              onClick={() => setViewMode('book')}
              className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-black transition-all ${
                viewMode === 'book'
                  ? 'bg-coral-500 text-white shadow-pop'
                  : 'text-ink-700 hover:bg-coral-50'
              }`}
            >
              📖 동화별
            </button>
          </div>
        </div>
      </header>

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
                  className={`group relative aspect-[3/4] rounded-2xl shadow-soft border-2 border-transparent overflow-hidden transition-all
                    bg-gradient-to-br from-cream-50 via-peach-100 to-coral-100/40
                    dark:from-slate-800 dark:via-slate-800 dark:to-slate-700
                    ${empty ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-pop hover:-translate-y-1 hover:border-coral-200 active:translate-y-0'}`}
                >
                  <div className="relative h-full flex flex-col items-center justify-center gap-3 p-4">
                    <div className="text-7xl drop-shadow-sm transition-transform group-hover:scale-110">
                      {cat.emoji}
                    </div>
                    <div className="text-lg font-black text-ink-900 dark:text-peach-100 font-display">
                      {cat.nameKo}
                    </div>
                    {empty ? (
                      <div className="text-xs text-ink-500 font-bold">곧 만나요!</div>
                    ) : (
                      <>
                        <div className="text-xs text-ink-700 font-bold">
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
