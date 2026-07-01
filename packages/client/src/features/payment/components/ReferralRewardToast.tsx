import { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useEntitlement } from '../hooks/useEntitlement';

/**
 * 친구 초대 보상 알림. 초대자는 세션에 없을 때 보상이 적립되므로(서버 RPC),
 * 다음 앱 진입 시 `referralBonusDays` 증가를 감지해 축하 토스트를 띄운다.
 *
 * per-account 로 마지막 확인값을 localStorage 에 저장 → 증가분만큼만 1회 축하.
 * 최초 로드(seen=null)엔 현재값을 기록만 하고 축하하지 않음(기존 보상 오축하 방지).
 */
export function ReferralRewardToast() {
  const { account } = useAuth();
  const { referralBonusDays } = useEntitlement();
  const [gained, setGained] = useState<number | null>(null);

  useEffect(() => {
    if (!account) return;
    const key = `tb_ref_bonus_seen:${account.id}`;
    let seenRaw: string | null;
    try {
      seenRaw = localStorage.getItem(key);
    } catch {
      return;
    }
    const persist = (v: number) => {
      try {
        localStorage.setItem(key, String(v));
      } catch {
        // best-effort
      }
    };

    if (seenRaw === null) {
      // 최초 관측 — 축하 없이 기준값만 저장
      persist(referralBonusDays);
      return;
    }
    const seen = Number(seenRaw) || 0;
    if (referralBonusDays > seen) {
      setGained(referralBonusDays - seen);
      persist(referralBonusDays);
    }
  }, [account, referralBonusDays]);

  // 자동 사라짐
  useEffect(() => {
    if (gained === null) return;
    const t = setTimeout(() => setGained(null), 6000);
    return () => clearTimeout(t);
  }, [gained]);

  if (gained === null) return null;

  return (
    <div
      className="fixed top-4 left-1/2 z-[60] -translate-x-1/2 w-[min(92vw,380px)]"
      role="status"
      aria-live="polite"
    >
      <button
        type="button"
        onClick={() => setGained(null)}
        className="w-full flex items-center gap-3 rounded-2xl bg-coral-500 text-white px-5 py-4 shadow-pop active:scale-[0.98] transition"
      >
        <span className="text-2xl" aria-hidden>
          🎉
        </span>
        <span className="flex-1 text-left font-black break-keep">
          친구 초대 성공! 무료 기간 <span className="underline">+{gained}일</span> 늘었어요
        </span>
        <span className="text-white/70 text-lg" aria-hidden>
          ✕
        </span>
      </button>
    </div>
  );
}
