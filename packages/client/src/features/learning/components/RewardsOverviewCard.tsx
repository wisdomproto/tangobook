import { useMemo } from 'react';
import { useStarBalance, useStarLedger } from '@/features/rewards';

export function RewardsOverviewCard() {
  const { data: balance } = useStarBalance();
  const { data: ledger } = useStarLedger(50);

  const weekStats = useMemo(() => {
    if (!ledger) return { earned: 0, spent: 0, todayEarned: 0 };
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400_000);
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    let earned = 0;
    let spent = 0;
    let todayEarned = 0;
    for (const r of ledger) {
      const at = new Date(r.created_at);
      if (at < weekAgo) continue;
      if (r.delta > 0) earned += r.delta;
      else spent += Math.abs(r.delta);
      if (at >= todayStart && r.delta > 0) todayEarned += r.delta;
    }
    return { earned, spent, todayEarned };
  }, [ledger]);

  const total = balance?.stars_total ?? 0;
  const streak = balance?.streak_days ?? 0;

  return (
    <div className="bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 rounded-2xl border border-amber-200 shadow-soft p-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat icon="⭐" label="현재 별" value={total} color="text-amber-600" big />
        <Stat icon="🔥" label="연속 출석" value={streak} suffix="일" color="text-orange-500" big />
        <Stat icon="📥" label="이번 주 모음" value={weekStats.earned} color="text-emerald-600" />
        <Stat icon="🛍️" label="이번 주 사용" value={weekStats.spent} color="text-purple-600" />
      </div>
      {weekStats.todayEarned > 0 && (
        <div className="mt-3 text-xs text-center text-amber-700 font-bold">
          오늘 +{weekStats.todayEarned} ⭐ 획득!
        </div>
      )}
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  suffix,
  color,
  big,
}: {
  icon: string;
  label: string;
  value: number;
  suffix?: string;
  color: string;
  big?: boolean;
}) {
  return (
    <div className="text-center">
      <div className={`${big ? 'text-3xl' : 'text-2xl'} mb-1`}>{icon}</div>
      <div className={`${big ? 'text-3xl' : 'text-xl'} font-black font-display ${color}`}>
        {value}
        {suffix && <span className="text-base ml-0.5">{suffix}</span>}
      </div>
      <div className="text-xs text-ink-500 font-bold mt-0.5">{label}</div>
    </div>
  );
}
