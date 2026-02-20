import { Request, Response, NextFunction } from 'express';
import { AudiobookService } from '../services/audiobook.service.js';

export const AudiobookController = {
  async generate(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AudiobookService.generate(req.body);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async getProgress(req: Request, res: Response) {
    const projectId = req.params.projectId as string;
    const progress = AudiobookService.getProgress(projectId);
    res.json({ success: true, data: progress });
  },
};
