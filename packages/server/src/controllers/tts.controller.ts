import { Request, Response, NextFunction } from 'express';
import { TtsService } from '../services/tts.service.js';

export const TtsController = {
  async generate(req: Request, res: Response, next: NextFunction) {
    try {
      const audioUrl = await TtsService.generate(req.body);
      res.json({ success: true, data: { audioUrl } });
    } catch (err) {
      next(err);
    }
  },

  async batch(req: Request, res: Response, next: NextFunction) {
    try {
      const results = await TtsService.batch(req.body);
      res.json({ success: true, data: results });
    } catch (err) {
      next(err);
    }
  },

  async upload(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, error: '파일이 없습니다.' });
        return;
      }
      const audioUrl = await TtsService.uploadAudio(req.file, req.body);
      res.json({ success: true, data: { audioUrl } });
    } catch (err) {
      next(err);
    }
  },
};
