import { useMemo } from 'react';
import { computeAccess, type AccessState } from '@tangobook/shared';
import { useAuth } from '@/features/auth/context/AuthContext';
import { PAYWALL_ENABLED } from '../config';

/** 유료화 비활성(개발단계) 시 — 항상 접근 허용. */
const ALWAYS_ENTITLED: AccessState = {
  status: 'subscribed',
  isEntitled: true,
  trialEndsAt: null,
  trialDaysLeft: 0,
};

/**
 * 현재 부모 계정의 유료화 접근 상태 (guest / trial / subscribed / expired).
 *
 * PAYWALL_ENABLED=false(개발단계)면 항상 ALWAYS_ENTITLED → 모든 게이팅 inert(전체 접근).
 * 활성화 시 가입일(account.createdAt) 기반 7일 체험을 계산.
 * TODO(Supabase 연동): subscription(Paddle webhook) · referralBonusDays(초대 적립) 주입.
 */
export function useAccess(): AccessState {
  const { account } = useAuth();
  return useMemo(() => {
    if (!PAYWALL_ENABLED) return ALWAYS_ENTITLED;
    return computeAccess({ account: account ? { createdAt: account.createdAt } : null });
  }, [account]);
}
