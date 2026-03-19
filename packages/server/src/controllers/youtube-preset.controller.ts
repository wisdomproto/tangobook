import type { Request, Response } from 'express';
import { YouTubePresetService } from '../services/youtube-preset.service.js';
import { asyncHandler } from '../middleware/async-handler.js';

export const YouTubePresetController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const presets = await YouTubePresetService.list();
    res.json({ success: true, data: presets });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const preset = await YouTubePresetService.create(req.body);
    res.json({ success: true, data: preset });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const preset = await YouTubePresetService.update(req.params.id as string, req.body);
    res.json({ success: true, data: preset });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await YouTubePresetService.remove(req.params.id as string);
    res.json({ success: true, data: null });
  }),
};
