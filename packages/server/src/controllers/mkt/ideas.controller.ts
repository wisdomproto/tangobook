import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { AppError } from '../../middleware/error.middleware.js';
import {
  recommendGoldenKeywords,
  generateIdeas as genIdeas,
  assembleTrending,
  type RecommendInput,
} from '../../services/mkt/ideas.service.js';

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

/** POST /api/mkt/ideas/generate  Body: { topic, channelTypes?, industry?, targetAudience? } */
export const generateIdeas = asyncHandler(async (req: Request, res: Response) => {
  const { topic, channelTypes, industry, targetAudience } = req.body as {
    topic?: string;
    channelTypes?: string[];
    industry?: string;
    targetAudience?: string;
  };
  if (!topic) throw new AppError(400, 'topic is required');
  const data = await genIdeas({ topic, channelTypes, industry, targetAudience });
  res.json({ success: true, data });
});

/** POST /api/mkt/ideas/trending  Body: { keywords: string[], language?, period? } */
export const trending = asyncHandler(async (req: Request, res: Response) => {
  const { keywords, language, period } = req.body as {
    keywords?: string[];
    language?: string;
    period?: 'week' | 'month' | 'quarter';
  };
  if (!Array.isArray(keywords) || keywords.length === 0) {
    throw new AppError(400, 'keywords[] is required and must be non-empty');
  }
  const data = await assembleTrending({ keywords, language, period });
  res.json({ success: true, data });
});
