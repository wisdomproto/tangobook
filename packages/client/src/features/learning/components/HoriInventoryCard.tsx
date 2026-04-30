import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { HORI_SLOTS, type HoriItem } from '@tangobook/shared';
import { useHoriCatalog, useHoriInventory } from '@/features/hori-room';

export function HoriInventoryCard() {
  const { data: catalog } = useHoriCatalog();
  const { data: inventory } = useHoriInventory();

  const slotStats = useMemo(() => {
    const map = new Map<string, { owned: number; equipped?: HoriItem }>();
    for (const slot of HORI_SLOTS) map.set(slot.id, { owned: 0 });
    if (!catalog || !inventory) return map;
    const inventoryMap = new Map(inventory.map((r) => [r.item_id, r]));
    for (const item of catalog.items) {
      const inv = inventoryMap.get(item.id);
      if (!inv) continue;
      const s = map.get(item.slot);
      if (!s) continue;
      s.owned += 1;
      if (inv.equipped) s.equipped = item;
    }
    return map;
  }, [catalog, inventory]);

  const totalOwned = useMemo(() => inventory?.length ?? 0, [inventory]);

  return (
    <div className="bg-white rounded-2xl border border-emerald-200 shadow-soft p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🦊</span>
          <h3 className="text-lg font-black font-display text-ink-900">호리 방</h3>
        </div>
        <Link to="/hori-room" className="text-xs text-coral-600 font-bold hover:underline">
          전체 보기 →
        </Link>
      </div>
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-3xl font-black font-display text-emerald-500">{totalOwned}</span>
        <span className="text-ink-500 font-bold">아이템</span>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {HORI_SLOTS.map((slot) => {
          const s = slotStats.get(slot.id) ?? { owned: 0 };
          return (
            <div
              key={slot.id}
              className="text-center bg-cream-50 rounded-xl p-2 border border-peach-200 relative"
            >
              <div className="text-2xl">{s.equipped ? s.equipped.preview : slot.emoji}</div>
              <div className="text-[11px] font-bold text-ink-700 mt-0.5">{slot.nameKo}</div>
              <div className="text-[11px] text-ink-500 mt-0.5">{s.owned}개</div>
              {s.equipped && (
                <div className="absolute top-1 right-1 text-[10px] text-success font-black">✓</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
