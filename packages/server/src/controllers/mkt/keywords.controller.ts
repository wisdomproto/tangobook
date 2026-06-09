import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { AppError } from '../../middleware/error.middleware.js';
import { searchKeywords } from '../../services/mkt/external/naver-searchad.js';
import { getKeywordVolumes } from '../../services/mkt/external/dataforseo.js';

/** POST /api/mkt/naver/keywords  Body: { keywords: string[] } */
export const naverKeywords = asyncHandler(async (req: Request, res: Response) => {
  const { keywords } = req.body as { keywords?: string[] };
  if (!Array.isArray(keywords) || keywords.length === 0) {
    throw new AppError(400, 'keywords[] is required and must be non-empty');
  }
  const result = await searchKeywords(keywords);
  res.json({ success: true, data: { keywords: result } });
});

/** POST /api/mkt/google/keywords  Body: { keywords: string[], locationCode?, languageCode? } */
export const googleKeywords = asyncHandler(async (req: Request, res: Response) => {
  const { keywords, locationCode, languageCode } = req.body as {
    keywords?: string[];
    locationCode?: number;
    languageCode?: string;
  };
  if (!Array.isArray(keywords) || keywords.length === 0) {
    throw new AppError(400, 'keywords[] is required and must be non-empty');
  }
  const result = await getKeywordVolumes(keywords, locationCode, languageCode);
  res.json({ success: true, data: { keywords: result } });
});
