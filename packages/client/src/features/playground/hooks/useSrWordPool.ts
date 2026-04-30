import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/context/AuthContext';
import type { Lang, SrPoolItem } from '@tangobook/shared';
import { playgroundApi } from '../api/playground.api';

export function useSrWordPool(params: {
  language: Lang;
  count?: number;
  recentStorybookId?: string;
}) {
  const { activeProfile } = useAuth();
  const profileId = activeProfile?.id;

  return useQuery<SrPoolItem[]>({
    queryKey: [
      'playground',
      'sr-pool',
      profileId,
      params.language,
      params.count,
      params.recentStorybookId,
    ],
    queryFn: () =>
      playgroundApi.getWordPool({
        profileId: profileId ?? 'guest',
        language: params.language,
        count: params.count,
        recentStorybookId: params.recentStorybookId,
      }),
    staleTime: 60_000,
  });
}
