import { KoreanJamoStrokeLibraryService } from '../services/korean-jamo-stroke-library.service.js';
import { asyncHandler } from '../middleware/async-handler.js';

export const KoreanJamoStrokeLibraryController = {
  get: asyncHandler(async (_req, res) => {
    const data = await KoreanJamoStrokeLibraryService.get();
    res.json({ success: true, data });
  }),

  put: asyncHandler(async (req, res) => {
    const data = await KoreanJamoStrokeLibraryService.put(req.body ?? {});
    res.json({ success: true, data });
  }),
};
