import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { COLLECTION_CATEGORIES } from '@tangobook/shared';
import { useCollectionCatalog, useCollectionUserState } from '@/features/collection';

export function CollectionProgressCard() {
  const { data: catalog } = useCollectionCatalog();
  const { statusMap } = useCollectionUserState();

  const stats = useMemo(() => {
    const map = new Map<string, { total: number; owned: number; active: number }>();
    for (const cat of COLLECTION_CATEGORIES) {
      map.set(cat.id, { total: 0, owned: 0, active: 0 });
    }
    for (const item of catalog?.items ?? []) {
      const s = map.get(item.category);
      if (!s) continue;
      s.total += 1;
      const status = statusMap.get(item.id);
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
    <div className="bg-white rounded-2xl border border-coral-200 shadow-soft p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🃏</span>
          <h3 className="text-lg font-black font-display text-ink-900">카드 도감</h3>
        </div>
        <Link to="/collection" className="text-xs text-coral-600 font-bold hover:underline">
          전체 보기 →
        </Link>
      </div>
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-3xl font-black font-display text-coral-500">{ownedTotal}</span>
        <span className="text-ink-500 font-bold">/</span>
        <span className="text-ink-700 font-bold">{totalCards}장</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {COLLECTION_CATEGORIES.map((cat) => {
          const s = stats.get(cat.id) ?? { total: 0, owned: 0, active: 0 };
          const pct = s.total > 0 ? (s.owned / s.total) * 100 : 0;
          return (
            <div
              key={cat.id}
              className="text-center bg-cream-50 rounded-xl p-2 border border-peach-200"
            >
              <div className="text-2xl">{cat.emoji}</div>
              <div className="text-[11px] font-bold text-ink-700 mt-0.5">{cat.nameKo}</div>
              <div className="text-[11px] text-ink-500 mt-0.5">
                {s.owned}/{s.total}
              </div>
              <div className="mt-1 h-1 bg-ink-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-coral-400 to-coral-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              {s.active > 0 && (
                <div className="text-[10px] mt-0.5 text-success font-black">✨{s.active}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
