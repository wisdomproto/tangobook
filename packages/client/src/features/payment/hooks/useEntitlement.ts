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
    staleTime: 1000 * 60 * 5, // 5 minutes
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
