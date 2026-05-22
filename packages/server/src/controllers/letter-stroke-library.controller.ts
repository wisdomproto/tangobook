import { LetterStrokeLibraryService } from '../services/letter-stroke-library.service.js';
import { asyncHandler } from '../middleware/async-handler.js';

export const LetterStrokeLibraryController = {
  get: asyncHandler(async (_req, res) => {
    const data = await LetterStrokeLibraryService.get();
    res.json({ success: true, data });
  }),

  put: asyncHandler(async (req, res) => {
    const data = await LetterStrokeLibraryService.put(req.body ?? {});
    res.json({ success: true, data });
  }),
};
