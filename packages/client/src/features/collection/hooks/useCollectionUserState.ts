import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/context/AuthContext';
import { collectionApi } from '../api/collection.api';
import type { CollectionStatus } from '@tangobook/shared';

export const COLLECTION_USER_KEY = (profileId: string) => ['collection', 'user', profileId];

export function useCollectionUserState() {
  const { activeProfile } = useAuth();
  const profileId = activeProfile?.id;

  const query = useQuery({
    queryKey: profileId ? COLLECTION_USER_KEY(profileId) : ['collection', 'user', null],
    queryFn: () => collectionApi.getUserState(profileId!),
    enabled: !!profileId,
    staleTime: 10_000,
  });

  /** itemId → status (locked 기본값) 매핑 헬퍼 */
  const statusMap = new Map<string, CollectionStatus>();
  for (const r of query.data ?? []) statusMap.set(r.item_id, r.status);

  return { ...query, statusMap, profileId };
}
