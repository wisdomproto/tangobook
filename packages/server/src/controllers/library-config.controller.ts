import { LibraryConfigService } from '../services/library-config.service.js';
import { asyncHandler } from '../middleware/async-handler.js';

export const LibraryConfigController = {
  get: asyncHandler(async (_req, res) => {
    const data = await LibraryConfigService.get();
    res.json({ success: true, data });
  }),

  put: asyncHandler(async (req, res) => {
    const data = await LibraryConfigService.put(req.body ?? {});
    res.json({ success: true, data });
  }),
};
