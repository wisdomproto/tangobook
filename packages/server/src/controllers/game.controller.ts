import { GameService } from '../services/game.service.js';
import { asyncHandler } from '../middleware/async-handler.js';

export const GameController = {
  generate: asyncHandler(async (req, res) => {
    const { storybookId, gameType, config } = req.body;
    const data = await GameService.generate(storybookId, gameType, config);
    res.json({ success: true, data });
  }),
};
