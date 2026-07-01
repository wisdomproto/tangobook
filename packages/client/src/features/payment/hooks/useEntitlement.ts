import { useQuery } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/features/auth/context/AuthContext';

export interface EntitlementData {
  paidUntil: string | null;
  referralBonusDays: number;
}

const ENTITLEMENT_DEFAULTS: EntitlementData = {
  paidUntil: null,
  referralBonusDays: 0,
};

export const ENTITLEMENT_QUERY_KEY = (accountId: string) => ['entitlement', accountId] as const;

/**
 * Reads the caller's entitlements row directly from Supabase (RLS own-row).
 * Disabled when no account or Supabase is unconfigured.
 */
export function useEntitlement(): EntitlementData {
  const { account } = useAuth();

  const { data } = useQuery({
    queryKey: account ? ENTITLEMENT_QUERY_KEY(account.id) : ['entitlement', null],
    enabled: Boolean(account && isSupabaseConfigured),
    // 친구 초대 보상(referral_bonus_days)이 서버에서 늘면 초대자가 앱에 돌아왔을 때 곧바로 잡아
    // ReferralRewardToast 가 뜨도록 — 짧은 staleTime + 포커스 재조회.
    staleTime: 1000 * 30, // 30s
    refetchOnWindowFocus: true,
    queryFn: async () => {
      if (!account) return ENTITLEMENT_DEFAULTS;
      const { data, error } = await supabase
        .from('entitlements')
        .select('paid_until, referral_bonus_days')
        .eq('account_id', account.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return ENTITLEMENT_DEFAULTS;
      return {
        paidUntil: (data.paid_until as string | null) ?? null,
        referralBonusDays: (data.referral_bonus_days as number | null) ?? 0,
      };
    },
  });

  return data ?? ENTITLEMENT_DEFAULTS;
}
