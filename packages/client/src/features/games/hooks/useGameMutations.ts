import { useMutation } from '@tanstack/react-query';
import { gamesApi } from '../api/games.api';
import type { GameTypeId, GameConfig } from '@tangobook/shared';

export function useGenerateGame() {
  return useMutation({
    mutationFn: (data: { storybookId: string; gameType: GameTypeId; config: GameConfig }) =>
      gamesApi.generate(data),
  });
}
