import type { CollectionItem, CollectionStatus } from '@tangobook/shared';

interface CardSlotProps {
  item: CollectionItem;
  status: CollectionStatus;
  onClick: () => void;
}

/**
 * 도감 카드 1장 슬롯. CategoryPage 와 BookCardsPage 양쪽에서 공용.
 *
 * 4단계별 표시:
 * - locked: 책 표지 노출 X — 그라데이션 + 🔒. 단어명은 라벨로 보여줌(아이가 다음 단어 hint 인지).
 * - silhouette: imageUrl grayscale.
 * - owned/active: imageUrl 풀컬러.
 *
 * 라벨은 항상 단어명 노출 — locked 라도 어떤 단어가 잠겼는지 알려줌.
 */
export function CardSlot({ item, status, onClick }: CardSlotProps) {
  const isLocked = status === 'locked';
  const isSilhouette = status === 'silhouette';
  const isActive = status === 'active';

  return (
    <button
      onClick={onClick}
      className={`group relative aspect-[3/4] rounded-2xl bg-white shadow-soft overflow-hidden transition-all
        ${isActive ? 'ring-2 ring-success shadow-pop' : ''}
        hover:-translate-y-1 hover:shadow-pop active:translate-y-0`}
    >
      {isLocked ? (
        <div className="absolute inset-0 bg-gradient-to-br from-cream-50 via-peach-100/60 to-coral-100/30 dark:from-slate-800 dark:via-slate-800 dark:to-slate-700">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-5xl opacity-50 drop-shadow-sm" aria-hidden>
              🔒
            </span>
          </div>
        </div>
      ) : (
        <img
          src={item.imageUrl}
          alt=""
          aria-hidden
          className={`absolute inset-0 w-full h-full object-cover transition-all
            ${isSilhouette ? 'grayscale brightness-75 opacity-80' : ''}`}
          loading="lazy"
        />
      )}

      {/* 카드 이름 라벨 — 항상 단어명 노출 */}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
        <div
          className={`text-white text-xs md:text-sm font-black text-center font-display drop-shadow-md line-clamp-2 ${isLocked ? 'opacity-85' : ''}`}
        >
          {item.nameKo}
        </div>
      </div>

      {isActive && (
        <div className="absolute top-2 right-2 bg-success text-white px-2 py-0.5 rounded-full text-xs font-black shadow-pop">
          ✨ 활성!
        </div>
      )}

      {item.rarity === 'foil' && (
        <div className="absolute top-2 left-2 text-yellow-400 text-lg drop-shadow-md">★</div>
      )}
    </button>
  );
}
