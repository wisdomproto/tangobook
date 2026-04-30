import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/context/AuthContext';
import { rewardsApi } from '../api/rewards.api';

export function useStarLedger(limit = 50) {
  const { activeProfile } = useAuth();
  const profileId = activeProfile?.id;

  return useQuery({
    queryKey: profileId ? ['rewards', 'ledger', profileId, limit] : ['rewards', 'ledger', null],
    queryFn: () => rewardsApi.getLedger(profileId!, limit),
    enabled: !!profileId,
    staleTime: 30_000,
  });
}
