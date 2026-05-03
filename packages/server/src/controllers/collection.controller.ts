import type { Request, Response, NextFunction } from 'express';
import type { CollectionItem } from '@tangobook/shared';
import { CollectionService } from '../services/collection.service.js';
import { R2Repository } from '../repositories/r2.repository.js';

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

  /**
   * 전체 책 → 카탈로그 재빌드 (admin).
   * 각 책의 dexCategory 있는 KeyObject 만 카드로 변환. dedupe 단어 단위.
   * Phase C (2026-05-03) — 책 단위 → 단어 단위 재설계.
   */
  async syncFromBooks(_req: Request, res: Response, next: NextFunction) {
    try {
      const summaries = await R2Repository.listStorybooks();
      let cardsAdded = 0;
      let cardsUpdated = 0;
      let booksProcessed = 0;
      for (const summary of summaries) {
        const book = await R2Repository.getStorybook(summary.id);
        if (!book) continue;
        const result = await CollectionService.syncFromStorybook(book);
        cardsAdded += result.cardsAdded;
        cardsUpdated += result.cardsUpdated;
        booksProcessed++;
      }
      res.json({
        success: true,
        data: { booksProcessed, cardsAdded, cardsUpdated },
      });
    } catch (err) {
      next(err);
    }
  },
};
