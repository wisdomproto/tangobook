import { VocabOverridesService } from '../services/vocab-overrides.service.js';
import { asyncHandler } from '../middleware/async-handler.js';

export const VocabOverridesController = {
  get: asyncHandler(async (_req, res) => {
    const data = await VocabOverridesService.get();
    res.json({ success: true, data });
  }),

  put: asyncHandler(async (req, res) => {
    const data = await VocabOverridesService.put(req.body ?? {});
    res.json({ success: true, data });
  }),
};
