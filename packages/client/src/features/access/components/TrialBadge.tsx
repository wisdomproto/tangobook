import { computeAccess } from '@tangobook/shared';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useEntitlement } from '@/features/payment/hooks/useEntitlement';
import { PAYWALL_ENABLED } from '../config';

/**
 * 사이드바 계정 영역에 상시 노출되는 작은 무료-체험 상태 칩.
 *
 * 배너(PromoBanner)와 동일하게 computeAccess 를 실계정+구독 데이터로 직접 계산 —
 * useAccess() 는 PAYWALL_ENABLED=false 면 모두 'subscribed' 로 만들어 체험 일수를 못 보므로 쓰지 않는다.
 * "로그인했는데 남은 일수가 안 보인다"를 배너 스크롤/캐시와 무관하게 해소한다.
 *
 *  - guest       → null (하단에 로그인 버튼이 있음)
 *  - trial       → 🎁 무료 체험 N일 남음
 *  - subscribed  → null (별도 표시 불필요)
 *  - expired     → PAYWALL 전이면 "정식 오픈 전 · 전권 무료", 후면 null
 */
export function TrialBadge() {
  const { account } = useAuth();
  const { paidUntil, referralBonusDays, trialStartedAt } = useEntitlement();

  if (!account) return null;

  const access = computeAccess({
    account: { createdAt: account.createdAt },
    subscription: paidUntil ? { status: 'active', currentPeriodEnd: paidUntil } : null,
    referralBonusDays,
    trialStartedAt,
  });

  if (access.status === 'trial') {
    return (
      <div className="mx-1 mb-1 rounded-xl bg-peach-100 px-3 py-2 text-center">
        <p className="text-[13px] font-black text-coral-600 break-keep">
          🎁 무료 체험 {access.trialDaysLeft}일 남음
        </p>
      </div>
    );
  }

  // 만료 + 정식 오픈 전 — 지금은 전권 무료라 안심 문구(체험 소진돼도 혼란 방지).
  if (access.status !== 'subscribed' && !PAYWALL_ENABLED) {
    return (
      <div className="mx-1 mb-1 rounded-xl bg-cream-100 px-3 py-2 text-center">
        <p className="text-[12px] font-bold text-ink-500 break-keep">
          정식 오픈 전 · 지금은 전권 무료
        </p>
      </div>
    );
  }

  return null;
}
