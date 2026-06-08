import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { AppError } from '../../middleware/error.middleware.js';
import { recommendGoldenKeywords, type RecommendInput } from '../../services/mkt/ideas.service.js';

/** POST /api/mkt/keywords/recommend  Body: { project, seedKeyword? } */
export const recommendKeywords = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as Partial<RecommendInput>;
  if (!body.project?.name) throw new AppError(400, 'project.name is required');
  const data = await recommendGoldenKeywords({
    project: body.project,
    seedKeyword: body.seedKeyword,
  });
  res.json({ success: true, data });
});
