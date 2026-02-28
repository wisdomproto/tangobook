import { ArtStyleLibraryService } from '../services/art-style-library.service.js';
import { asyncHandler } from '../middleware/async-handler.js';

export const ArtStyleLibraryController = {
  list: asyncHandler(async (_req, res) => {
    const data = await ArtStyleLibraryService.list();
    res.json({ success: true, data });
  }),

  save: asyncHandler(async (req, res) => {
    const { name, prompt, referenceImageUrl } = req.body;
    const saved = await ArtStyleLibraryService.save({ name, prompt, referenceImageUrl });
    res.json({ success: true, data: saved });
  }),

  remove: asyncHandler(async (req, res) => {
    const id = req.params.id as string;
    await ArtStyleLibraryService.remove(id);
    res.json({ success: true });
  }),

  removeAll: asyncHandler(async (_req, res) => {
    const result = await ArtStyleLibraryService.removeAll();
    res.json({ success: true, data: result });
  }),
};
