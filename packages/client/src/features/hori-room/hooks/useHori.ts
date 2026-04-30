import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/context/AuthContext';
import { STAR_BALANCE_KEY } from '@/features/rewards';
import { horiApi } from '../api/hori.api';

export const HORI_INVENTORY_KEY = (profileId: string) => ['hori', 'inventory', profileId];

export function useHoriCatalog() {
  return useQuery({
    queryKey: ['hori', 'catalog'],
    queryFn: horiApi.getCatalog,
    staleTime: 5 * 60_000,
  });
}

export function useHoriInventory() {
  const { activeProfile } = useAuth();
  const profileId = activeProfile?.id;
  return useQuery({
    queryKey: profileId ? HORI_INVENTORY_KEY(profileId) : ['hori', 'inventory', null],
    queryFn: () => horiApi.getInventory(profileId!),
    enabled: !!profileId,
    staleTime: 10_000,
  });
}

export function usePurchaseHoriItem() {
  const { activeProfile } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, cost }: { itemId: string; cost: number }) => {
      if (!activeProfile?.id) throw new Error('no active profile');
      return horiApi.purchase(activeProfile.id, itemId, cost);
    },
    onSuccess: () => {
      if (!activeProfile?.id) return;
      void queryClient.invalidateQueries({ queryKey: HORI_INVENTORY_KEY(activeProfile.id) });
      void queryClient.invalidateQueries({ queryKey: STAR_BALANCE_KEY(activeProfile.id) });
    },
  });
}

export function useEquipHoriItem() {
  const { activeProfile } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, equipped }: { itemId: string; equipped: boolean }) => {
      if (!activeProfile?.id) throw new Error('no active profile');
      return horiApi.setEquipped(activeProfile.id, itemId, equipped);
    },
    onSuccess: () => {
      if (!activeProfile?.id) return;
      void queryClient.invalidateQueries({ queryKey: HORI_INVENTORY_KEY(activeProfile.id) });
    },
  });
}
