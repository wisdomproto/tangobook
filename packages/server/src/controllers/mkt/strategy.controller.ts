import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { listStrategyTemplates } from '../../services/mkt/strategy.service.js';

/** GET /api/mkt/strategy/templates  → { templates: StrategyTemplateMeta[] } */
export const strategyTemplates = asyncHandler(async (_req: Request, res: Response) => {
  const data = await listStrategyTemplates();
  res.json({ success: true, data });
});
