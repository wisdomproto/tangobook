import { StyleGenreMapService } from '../services/style-genre-map.service.js';
import { asyncHandler } from '../middleware/async-handler.js';

export const StyleGenreMapController = {
  get: asyncHandler(async (_req, res) => {
    const data = await StyleGenreMapService.get();
    res.json({ success: true, data });
  }),

  put: asyncHandler(async (req, res) => {
    const data = await StyleGenreMapService.put(req.body ?? {});
    res.json({ success: true, data });
  }),
};
