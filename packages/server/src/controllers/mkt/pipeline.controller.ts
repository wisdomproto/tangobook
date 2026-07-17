import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { getPipeline } from '../../services/content-pipeline/content-pipeline.service.js';

/**
 * GET /api/mkt/pipeline → { rows, todos, generatedAt } (대표용 관제탑 — 저작+마케팅+할일 전체)
 * ?refresh=1 = 캐시 무시 재감사.
 */
export const pipelineOverview = asyncHandler(async (req: Request, res: Response) => {
  const refresh = req.query.refresh === '1';
  const data = await getPipeline(refresh);
  res.json({ success: true, data });
});
