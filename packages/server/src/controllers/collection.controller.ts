import type { Request, Response, NextFunction } from 'express';
import type { CollectionItem } from '@tangobook/shared';
import { CollectionService } from '../services/collection.service.js';

export const CollectionController = {
  async getCatalog(_req: Request, res: Response, next: NextFunction) {
    try {
      const catalog = await CollectionService.getCatalog();
      res.json({ success: true, data: catalog });
    } catch (err) {
      next(err);
    }
  },

  async getStorybookIndex(_req: Request, res: Response, next: NextFunction) {
    try {
      const index = await CollectionService.buildStorybookCardIndex();
      res.json({ success: true, data: index });
    } catch (err) {
      next(err);
    }
  },

  /** 카탈로그에 카드 upsert (admin) */
  async upsertItems(req: Request, res: Response, next: NextFunction) {
    try {
      const items = req.body?.items as CollectionItem[] | undefined;
      if (!Array.isArray(items)) {
        res.status(400).json({ success: false, error: 'items[] required' });
        return;
      }
      const result = await CollectionService.upsertItems(items);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
};
