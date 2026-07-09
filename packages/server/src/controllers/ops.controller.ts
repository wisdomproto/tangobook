import type { Request, Response, NextFunction } from 'express';
import { getOpsOverview } from '../services/ops.service.js';

export const OpsController = {
  async getOverview(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await getOpsOverview();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
};
