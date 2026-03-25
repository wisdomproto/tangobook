import type { Request, Response } from 'express';
import { AudiobookService } from '../services/audiobook.service.js';
import { asyncHandler } from '../middleware/async-handler.js';

export const AudiobookController = {
  render: asyncHandler(async (req, res) => {
    const result = await AudiobookService.render(req.body);
    res.json({ success: true, data: result });
  }),

  getRenderProgress(req: Request, res: Response) {
    const projectId = req.params.projectId as string;
    const progress = AudiobookService.getRenderProgress(projectId);
    res.json({ success: true, data: progress });
  },

  youtubeUpload: asyncHandler(async (_req, res) => {
    // TODO: Implement YouTube upload using existing youtube.provider.ts
    res.json({
      success: true,
      data: { message: 'YouTube upload not yet implemented for audiobook' },
    });
  }),

  youtubeGenerateMeta: asyncHandler(async (_req, res) => {
    // TODO: Implement AI meta generation
    res.json({
      success: true,
      data: { message: 'Meta generation not yet implemented for audiobook' },
    });
  }),
};
