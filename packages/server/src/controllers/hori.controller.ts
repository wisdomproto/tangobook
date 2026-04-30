import type { Request, Response, NextFunction } from 'express';
import type { HoriItem } from '@tangobook/shared';
import { HoriService } from '../services/hori.service.js';

export const HoriController = {
  async getCatalog(_req: Request, res: Response, next: NextFunction) {
    try {
      const catalog = await HoriService.getCatalog();
      res.json({ success: true, data: catalog });
    } catch (err) {
      next(err);
    }
  },

  async upsertItems(req: Request, res: Response, next: NextFunction) {
    try {
      const items = req.body?.items as HoriItem[] | undefined;
      if (!Array.isArray(items)) {
        res.status(400).json({ success: false, error: 'items[] required' });
        return;
      }
      const result = await HoriService.upsertItems(items);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
};
