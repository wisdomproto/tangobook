import { Request, Response, NextFunction } from 'express';
import { TranslationService } from '../services/translation.service.js';

export const TranslationController = {
  async translatePage(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await TranslationService.translatePage(req.body);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async translateBatch(req: Request, res: Response, next: NextFunction) {
    try {
      const results = await TranslationService.translateBatch(req.body);
      res.json({ success: true, data: results });
    } catch (err) {
      next(err);
    }
  },
};
