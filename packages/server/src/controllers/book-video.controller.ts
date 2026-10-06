import { asyncHandler } from '../middleware/async-handler.js';
import { BookVideoService } from '../services/book-video.service.js';

export const BookVideoController = {
  get: asyncHandler(async (req, res) => {
    res.json({ success: true, data: await BookVideoService.get(req.params['id'] as string) });
  }),
  presign: asyncHandler(async (req, res) => {
    res.json({
      success: true,
      data: await BookVideoService.presign(req.params['id'] as string, req.body ?? {}),
    });
  }),
  save: asyncHandler(async (req, res) => {
    res.json({
      success: true,
      data: await BookVideoService.save(req.params['id'] as string, req.body ?? {}),
    });
  }),
  register: asyncHandler(async (req, res) => {
    res.json({
      success: true,
      data: await BookVideoService.register(req.params['id'] as string, req.body?.versionId),
    });
  }),
};
