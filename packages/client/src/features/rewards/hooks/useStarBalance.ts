import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/context/AuthContext';
import { rewardsApi } from '../api/rewards.api';

export const STAR_BALANCE_KEY = (profileId: string) => ['rewards', 'balance', profileId];

export function useStarBalance() {
  const { activeProfile } = useAuth();
  const profileId = activeProfile?.id;

  return useQuery({
    queryKey: profileId ? STAR_BALANCE_KEY(profileId) : ['rewards', 'balance', null],
    queryFn: () => rewardsApi.getBalance(profileId!),
    enabled: !!profileId,
    staleTime: 5_000,
    refetchOnWindowFocus: true,
  });
}
