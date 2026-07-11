import { useTranslation } from 'react-i18next';

interface PlanCardProps {
  id: string;
  name: string;
  amount: number;
  /** 정가 (할인 중일 때만) — 취소선 + 할인율 배지 표시 */
  originalAmount?: number;
  days: number;
  onSelect: () => void;
  disabled?: boolean;
}

/**
 * Presentational card for a single subscription plan.
 */
export function PlanCard({
  id,
  name,
  amount,
  originalAmount,
  days,
  onSelect,
  disabled,
}: PlanCardProps) {
  const { t } = useTranslation('payment');
  const isYear = days >= 365;
  const perMonth = isYear ? Math.round(amount / 12) : null;
  const hasDiscount = typeof originalAmount === 'number' && originalAmount > amount;
  const discountPct = hasDiscount ? Math.round((1 - amount / originalAmount) * 100) : 0;

  const formatKRW = (n: number): string => t('price', { amount: n.toLocaleString('ko-KR') });

  return (
    <div
      className="relative flex flex-col items-center gap-3 rounded-3xl bg-white p-6 text-center shadow-pop"
      data-plan-id={id}
    >
      {isYear && (
        <span className="absolute right-4 top-4 rounded-full bg-coral-500 px-3 py-1 text-xs font-black text-white">
          BEST
        </span>
      )}
      <h3 className="font-display text-xl font-black text-ink-900 break-keep">{name}</h3>
      {hasDiscount && (
        <p className="flex items-center justify-center gap-2 -mb-2">
          <span className="text-base font-bold text-ink-300 line-through">
            {formatKRW(originalAmount)}
          </span>
          <span className="rounded-full bg-danger/10 px-2 py-0.5 text-xs font-black text-danger">
            {discountPct}%
          </span>
        </p>
      )}
      <p className="text-3xl font-black text-coral-600">{formatKRW(amount)}</p>
      {perMonth && (
        <p className="text-sm text-ink-500 break-keep">
          {t('planCard.perMonth', { price: formatKRW(perMonth), days })}
        </p>
      )}
      {!perMonth && <p className="text-sm text-ink-500">{t('planCard.daysUse', { days })}</p>}
      <button
        type="button"
        onClick={onSelect}
        disabled={disabled}
        className="mt-2 w-full rounded-full bg-coral-500 py-3 font-black text-white shadow-pop transition hover:bg-coral-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {t('planCard.select')}
      </button>
    </div>
  );
}
