import { ArtStyleLibraryService } from '../services/art-style-library.service.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { AppError } from '../middleware/error.middleware.js';

export const ArtStyleLibraryController = {
  list: asyncHandler(async (_req, res) => {
    const data = await ArtStyleLibraryService.list();
    res.json({ success: true, data });
  }),

  save: asyncHandler(async (req, res) => {
    const { id, name, prompt, referenceImageUrl } = req.body;
    if (!name || !prompt) throw new AppError(400, 'name 과 prompt 는 필수입니다.');
    const saved = await ArtStyleLibraryService.save({ id, name, prompt, referenceImageUrl });
    res.json({ success: true, data: saved });
  }),

  update: asyncHandler(async (req, res) => {
    const id = req.params.id as string;
    const { name, prompt, referenceImageUrl } = req.body;
    const updated = await ArtStyleLibraryService.update(id, { name, prompt, referenceImageUrl });
    res.json({ success: true, data: updated });
  }),

  reorder: asyncHandler(async (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids)) throw new AppError(400, 'ids 는 string array 여야 합니다.');
    const data = await ArtStyleLibraryService.reorder(ids);
    res.json({ success: true, data });
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
