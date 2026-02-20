import { Request, Response } from 'express';
import { AudiobookService } from '../services/audiobook.service.js';
import { asyncHandler } from '../middleware/async-handler.js';

export const AudiobookController = {
  generate: asyncHandler(async (req, res) => {
    const result = await AudiobookService.generate(req.body);
    res.json({ success: true, data: result });
  }),

  getProgress(req: Request, res: Response) {
    const projectId = req.params.projectId as string;
    const progress = AudiobookService.getProgress(projectId);
    res.json({ success: true, data: progress });
  },
};
