/**
 * Competitor controllers — gap-analysis / keyword-rankings / suggest-competitors.
 *
 * All three are transient mutations (not cached client-side); the client sends
 * only the inputs (projectUrl, competitorUrls, keywords, industry, services…),
 * never any secret credentials.
 *
 * Routes registered in mkt.routes.ts:
 *   POST /api/mkt/competitors/gap-analysis      → gapAnalysis
 *   POST /api/mkt/competitors/keyword-rankings  → keywordRankings
 *   POST /api/mkt/competitors/suggest           → suggestCompetitors
 *   POST /api/mkt/competitors/serp              → serpAnalysis (DataForSEO)
 */

import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { AppError } from '../../middleware/error.middleware.js';
import {
  gapAnalysis,
  keywordRankings,
  suggestCompetitors,
  serpAnalysis,
} from '../../services/mkt/competitors.service.js';

/** POST /api/mkt/competitors/gap-analysis
 *  Body: { projectUrl, competitorUrls, keywords?, industry? }
 */
export const competitorsGapAnalysis = asyncHandler(async (req: Request, res: Response) => {
  const { projectUrl, competitorUrls, keywords, industry } = req.body as {
    projectUrl?: string;
    competitorUrls?: string[];
    keywords?: string[];
    industry?: string;
  };
  if (!projectUrl) throw new AppError(400, 'projectUrl is required');
  if (!competitorUrls?.length) throw new AppError(400, 'competitorUrls is required');
  const data = await gapAnalysis({ projectUrl, competitorUrls, keywords, industry });
  res.json({ success: true, data });
});

/** POST /api/mkt/competitors/keyword-rankings
 *  Body: { projectUrl?, competitorUrls?, keywords }
 */
export const competitorsKeywordRankings = asyncHandler(async (req: Request, res: Response) => {
  const { projectUrl, competitorUrls, keywords } = req.body as {
    projectUrl?: string;
    competitorUrls?: string[];
    keywords?: string[];
  };
  if (!keywords?.length) throw new AppError(400, 'keywords are required');
  const data = await keywordRankings({ projectUrl, competitorUrls, keywords });
  res.json({ success: true, data });
});

/** POST /api/mkt/competitors/suggest
 *  Body: { industry, services, targetCustomer?, usp? }
 */
export const competitorsSuggest = asyncHandler(async (req: Request, res: Response) => {
  const { industry, services, targetCustomer, usp } = req.body as {
    industry?: string;
    services?: string;
    targetCustomer?: string;
    usp?: string;
  };
  if (!industry && !services) {
    throw new AppError(400, '업종 또는 서비스 정보를 입력해 주세요.');
  }
  const data = await suggestCompetitors({
    industry: industry ?? '',
    services: services ?? '',
    targetCustomer,
    usp,
  });
  res.json({ success: true, data });
});

/** POST /api/mkt/competitors/serp
 *  Body: { keyword, language? } — DataForSEO live SERP (creds read server-side).
 */
export const competitorsSerp = asyncHandler(async (req: Request, res: Response) => {
  const { keyword, language } = req.body as { keyword?: string; language?: string };
  if (!keyword) throw new AppError(400, 'keyword is required');
  const items = await serpAnalysis(keyword, language ?? 'ko');
  res.json({ success: true, data: { items } });
});
