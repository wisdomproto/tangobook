import { apiPost } from '@/lib/axios';
import type { GameTypeId, GameConfig, GameData } from '@tangobook/shared';

export const gamesApi = {
  generate: (data: { storybookId: string; gameType: GameTypeId; config: GameConfig }) =>
    apiPost<GameData>('/games/generate', data),
};
