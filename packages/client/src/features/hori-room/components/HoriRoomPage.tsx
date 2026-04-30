import { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HORI_SLOTS,
  type HoriItem,
  type HoriItemSlot,
  type HoriInventoryRecord,
} from '@tangobook/shared';
import { Mascot, Skeleton } from '@/design-system';
import { StarCounter, useStarBalance } from '@/features/rewards';
import { useAuth } from '@/features/auth/context/AuthContext';
import {
  useHoriCatalog,
  useHoriInventory,
  usePurchaseHoriItem,
  useEquipHoriItem,
} from '../hooks/useHori';

export function HoriRoomPage() {
  const navigate = useNavigate();
  const { activeProfile } = useAuth();
  const { data: catalog, isLoading: catalogLoading } = useHoriCatalog();
  const { data: inventory } = useHoriInventory();
  const { data: balance } = useStarBalance();
  const purchase = usePurchaseHoriItem();
  const equip = useEquipHoriItem();

  const [activeSlot, setActiveSlot] = useState<HoriItemSlot>('outfit');

  // 인벤토리 set + equipped per slot
  const inventoryMap = useMemo(() => {
    const m = new Map<string, HoriInventoryRecord>();
    for (const r of inventory ?? []) m.set(r.item_id, r);
    return m;
  }, [inventory]);

  const equippedItems = useMemo(() => {
    if (!catalog) return new Map<HoriItemSlot, HoriItem>();
    const m = new Map<HoriItemSlot, HoriItem>();
    for (const item of catalog.items) {
      const inv = inventoryMap.get(item.id);
      if (inv?.equipped) m.set(item.slot, item);
    }
    return m;
  }, [catalog, inventoryMap]);

  const slotItems = useMemo(() => {
    return catalog?.items.filter((i) => i.slot === activeSlot) ?? [];
  }, [catalog, activeSlot]);

  const equippedOutfit = equippedItems.get('outfit');
  const equippedAccessory = equippedItems.get('accessory');
  const equippedBackground = equippedItems.get('background');
  const equippedSeason = equippedItems.get('season');

  const handlePurchase = async (item: HoriItem) => {
    if (!activeProfile?.id) {
      alert('자녀 프로필을 먼저 선택해주세요!');
      return;
    }
    const cur = balance?.stars_total ?? 0;
    if (cur < item.starsCost) {
      alert(`별이 ${item.starsCost - cur}개 부족해요!`);
      return;
    }
    try {
      await purchase.mutateAsync({ itemId: item.id, cost: item.starsCost });
    } catch (err) {
      alert(`구매 실패: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleEquip = async (item: HoriItem) => {
    const inv = inventoryMap.get(item.id);
    if (!inv) return;
    // 같은 slot 의 다른 장착 해제 후 이거 장착 (한 번에)
    const isEquipped = inv.equipped;
    try {
      // 해제 모드면 그냥 해제
      if (isEquipped) {
        await equip.mutateAsync({ itemId: item.id, equipped: false });
        return;
      }
      // 같은 slot equipped 다른 아이템 해제
      const sameSlotEquipped = catalog?.items
        .filter((i) => i.slot === item.slot && i.id !== item.id)
        .find((i) => inventoryMap.get(i.id)?.equipped);
      if (sameSlotEquipped) {
        await equip.mutateAsync({ itemId: sameSlotEquipped.id, equipped: false });
      }
      await equip.mutateAsync({ itemId: item.id, equipped: true });
    } catch (err) {
      alert(`장착 실패: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const bgPreview = equippedBackground?.preview ?? '🌈';

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 via-peach-100 to-coral-100/40 dark:from-darkbg dark:via-slate-900 dark:to-slate-900">
      {/* 헤더 */}
      <header className="px-6 pt-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/library')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-soft text-ink-700 font-bold hover:shadow-pop transition"
          >
            ← 돌아가기
          </button>
          <div className="flex items-center gap-2">
            <StarCounter />
            <Link
              to="/library"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-soft text-ink-700 font-bold hover:shadow-pop transition"
            >
              🏠 홈
            </Link>
          </div>
        </div>
      </header>

      <main className="px-6 pb-12 max-w-5xl mx-auto space-y-6">
        {/* 호리 + 배경 */}
        <section className="relative aspect-[16/10] rounded-3xl bg-white shadow-card overflow-hidden">
          {/* 배경 — 이모지 큰 평면 */}
          <div className="absolute inset-0 bg-gradient-to-b from-sky-100 via-cream-50 to-peach-100 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
            <span className="text-[18rem] opacity-30 select-none" aria-hidden>
              {bgPreview}
            </span>
          </div>

          {/* 호리 (가운데) + 장착 아이템 오버레이 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <Mascot state={equippedSeason ? 'celebrating' : 'cheering'} size="xl" />
              {/* outfit 표시 (호리 아래쪽) */}
              {equippedOutfit && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-5xl drop-shadow-md">
                  {equippedOutfit.preview}
                </div>
              )}
              {/* accessory 표시 (호리 위쪽) */}
              {equippedAccessory && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-5xl drop-shadow-md">
                  {equippedAccessory.preview}
                </div>
              )}
              {/* season — 옆에 큰 이모지 */}
              {equippedSeason && (
                <div className="absolute -right-12 top-2 text-6xl drop-shadow-md animate-bounce">
                  {equippedSeason.preview}
                </div>
              )}
            </div>
          </div>

          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-center gap-2 text-ink-700 text-sm font-bold">
            <span>👋</span>
            <span>안녕! 나는 호리야. 별로 옷·방을 꾸며줘!</span>
          </div>
        </section>

        {/* 슬롯 탭 */}
        <section>
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
            {HORI_SLOTS.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSlot(s.id)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition shadow-soft ${
                  activeSlot === s.id
                    ? 'bg-coral-500 text-white shadow-pop'
                    : 'bg-white text-ink-700 hover:bg-peach-100'
                }`}
              >
                <span>{s.emoji}</span>
                <span>{s.nameKo}</span>
              </button>
            ))}
          </div>

          {/* 아이템 그리드 */}
          {catalogLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-2xl" />
              ))}
            </div>
          ) : slotItems.length === 0 ? (
            <div className="text-center py-12 text-ink-500 font-bold">곧 만나요!</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {slotItems.map((item) => {
                const inv = inventoryMap.get(item.id);
                const owned = !!inv;
                const equipped = !!inv?.equipped;
                const cur = balance?.stars_total ?? 0;
                const affordable = cur >= item.starsCost;

                return (
                  <ItemCard
                    key={item.id}
                    item={item}
                    owned={owned}
                    equipped={equipped}
                    affordable={affordable}
                    onPurchase={() => handlePurchase(item)}
                    onEquip={() => handleEquip(item)}
                  />
                );
              })}
            </div>
          )}
        </section>

        {/* 별 사다리 안내 */}
        <section className="bg-white rounded-2xl shadow-soft p-5">
          <h3 className="text-lg font-black font-display text-ink-900 mb-3">⭐ 별 사다리</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
            {[
              { stars: 100, emoji: '👕', label: '옷 1벌' },
              { stars: 300, emoji: '🎩', label: '액세서리' },
              { stars: 500, emoji: '🏠', label: '방 1테마' },
              { stars: 800, emoji: '🃏', label: '희귀 카드' },
              { stars: 2000, emoji: '🌟', label: '시즌 코스튬' },
            ].map((t) => (
              <div key={t.stars} className="bg-cream-50 rounded-xl p-3 border border-peach-200">
                <div className="text-xs font-black text-coral-500">{t.stars}★</div>
                <div className="text-3xl my-1">{t.emoji}</div>
                <div className="text-xs text-ink-700 font-bold">{t.label}</div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <PurchaseToast pending={purchase.isPending} />
    </div>
  );
}

interface ItemCardProps {
  item: HoriItem;
  owned: boolean;
  equipped: boolean;
  affordable: boolean;
  onPurchase: () => void;
  onEquip: () => void;
}

function ItemCard({ item, owned, equipped, affordable, onPurchase, onEquip }: ItemCardProps) {
  return (
    <div
      className={`relative bg-white rounded-2xl shadow-soft p-4 flex flex-col items-center transition hover:shadow-pop ${
        equipped ? 'ring-2 ring-success' : ''
      }`}
    >
      <div className="aspect-square w-full flex items-center justify-center bg-cream-50 rounded-xl mb-2">
        <span className="text-5xl">{item.preview}</span>
      </div>
      <div className="text-sm font-black text-ink-900 text-center font-display line-clamp-1">
        {item.nameKo}
      </div>
      {item.description && (
        <div className="text-[11px] text-ink-500 text-center line-clamp-1 mt-0.5">
          {item.description}
        </div>
      )}

      {owned ? (
        <button
          onClick={onEquip}
          className={`mt-3 w-full px-3 py-1.5 rounded-full text-sm font-black transition ${
            equipped
              ? 'bg-success text-white shadow-pop'
              : 'bg-coral-100 text-coral-600 hover:bg-coral-200'
          }`}
        >
          {equipped ? '✓ 장착중' : '입기'}
        </button>
      ) : (
        <button
          onClick={onPurchase}
          disabled={!affordable}
          className={`mt-3 w-full px-3 py-1.5 rounded-full text-sm font-black transition ${
            affordable
              ? 'bg-gradient-to-r from-coral-400 to-coral-500 text-white shadow-pop hover:brightness-110'
              : 'bg-ink-100 text-ink-500 cursor-not-allowed'
          }`}
        >
          ⭐ {item.starsCost}
        </button>
      )}

      {item.rarity === 'seasonal' && (
        <div className="absolute top-2 right-2 text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full font-black">
          시즌
        </div>
      )}
    </div>
  );
}

function PurchaseToast({ pending }: { pending: boolean }) {
  return (
    <AnimatePresence>
      {pending && (
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 bg-coral-500 text-white rounded-full shadow-pop font-black"
        >
          ⏳ 구매 중...
        </motion.div>
      )}
    </AnimatePresence>
  );
}
