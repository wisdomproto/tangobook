import { useMemo } from 'react';
import { computeAccess, type AccessState } from '@tangobook/shared';
import { useAuth } from '@/features/auth/context/AuthContext';

/**
 * 현재 부모 계정의 유료화 접근 상태 (guest / trial / subscribed / expired).
 *
 * 현재는 가입일(account.createdAt) 기반 7일 체험만 계산.
 * TODO(Supabase 연동): subscription(Paddle webhook 적재) · referralBonusDays(초대 적립)를 주입.
 */
export function useAccess(): AccessState {
  const { account } = useAuth();
  return useMemo(
    () => computeAccess({ account: account ? { createdAt: account.createdAt } : null }),
    [account]
  );
}
