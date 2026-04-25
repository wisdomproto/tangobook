import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bookV2Api } from '../api/book-v2.api';
import type { ReadingLevel } from '@tangobook/shared';

interface GamesFilter {
  level?: ReadingLevel;
  language?: string;
}

export function useGamesList(bid: string, filter?: GamesFilter) {
  return useQuery({
    queryKey: ['book-v2', 'games', bid, filter?.level, filter?.language],
    queryFn: () => bookV2Api.listGames(bid, filter),
    enabled: !!bid,
  });
}

export function useGame(bid: string, gameId: string | null) {
  return useQuery({
    queryKey: ['book-v2', 'games', bid, 'instance', gameId],
    queryFn: () => bookV2Api.getGame(bid, gameId!),
    enabled: !!bid && !!gameId,
  });
}

export function useDeleteGame(bid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (gameId: string) => bookV2Api.deleteGame(bid, gameId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['book-v2', 'games', bid] });
    },
  });
}
