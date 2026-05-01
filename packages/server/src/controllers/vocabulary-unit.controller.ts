import type { Request, Response, NextFunction } from 'express';
import type { VocabularyUnit } from '@tangobook/shared';
import { VocabularyUnitService } from '../services/vocabulary-unit.service.js';

export const VocabularyUnitController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const items = await VocabularyUnitService.list();
      res.json({ success: true, data: items });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const unit = await VocabularyUnitService.getById(id);
      if (!unit) {
        res.status(404).json({ success: false, error: 'unit not found' });
        return;
      }
      res.json({ success: true, data: unit });
    } catch (err) {
      next(err);
    }
  },

  async upsert(req: Request, res: Response, next: NextFunction) {
    try {
      const unit = req.body as VocabularyUnit;
      if (!unit?.id) {
        res.status(400).json({ success: false, error: 'unit.id required' });
        return;
      }
      await VocabularyUnitService.upsert(unit);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const ok = await VocabularyUnitService.delete(id);
      if (!ok) {
        res.status(404).json({ success: false, error: 'unit not found' });
        return;
      }
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },

  async seedCambridge(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await VocabularyUnitService.seedCambridgeStarters();
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
};
