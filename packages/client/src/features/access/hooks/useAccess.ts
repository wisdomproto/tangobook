import { useMemo } from 'react';
import { computeAccess, type AccessState } from '@tangobook/shared';
import { useAuth } from '@/features/auth/context/AuthContext';
import { PAYWALL_ENABLED, LOCK_FOR_GUESTS } from '../config';
import { useEntitlement } from '@/features/payment/hooks/useEntitlement';

/** 유료화 비활성(개발단계) 시 — 항상 접근 허용. */
const ALWAYS_ENTITLED: AccessState = {
  status: 'subscribed',
  isEntitled: true,
  trialEndsAt: null,
  trialDaysLeft: 0,
};

/** 게스트 소프트 게이팅 — 무료 책만 열람(프리미엄 잠금)으로 가입 유도. */
const GUEST_LOCKED: AccessState = {
  status: 'guest',
  isEntitled: false,
  trialEndsAt: null,
  trialDaysLeft: 0,
};

/**
 * 현재 부모 계정의 유료화 접근 상태 (guest / trial / subscribed / expired).
 *
 * PAYWALL_ENABLED=false(개발단계)면 항상 ALWAYS_ENTITLED → 모든 게이팅 inert(전체 접근).
 * 활성화 시 Supabase entitlements 행(paidUntil, referralBonusDays) + 가입일 기반 7일 체험으로 판정.
 */
export function useAccess(): AccessState {
  const { account } = useAuth();
  // Always call unconditionally (hooks rules); self-disables when account is null or Supabase unconfigured.
  const { paidUntil, referralBonusDays, trialStartedAt } = useEntitlement();

  return useMemo(() => {
    if (!PAYWALL_ENABLED) {
      // 출시 전: 로그인 사용자는 전체 열람, 게스트는(플래그 시) 무료 책만 → 가입 유도.
      if (LOCK_FOR_GUESTS && !account) return GUEST_LOCKED;
      return ALWAYS_ENTITLED;
    }
    return computeAccess({
      account: account ? { createdAt: account.createdAt } : null,
      subscription: paidUntil ? { status: 'active', currentPeriodEnd: paidUntil } : null,
      referralBonusDays,
      trialStartedAt,
    });
  }, [account, paidUntil, referralBonusDays, trialStartedAt]);
}
