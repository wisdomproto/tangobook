import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { AppError } from '../../middleware/error.middleware.js';
import {
  searchMonitoring,
  monitoringComment as monitoringCommentSvc,
} from '../../services/mkt/monitoring.service.js';

/**
 * POST /api/mkt/monitoring/search
 * Body: { projectId, keyword, language?, sources? }
 * Fans out across feed sources server-side; never throws per-source (returns { items }).
 */
export const monitoringSearch = asyncHandler(async (req: Request, res: Response) => {
  const { projectId, keyword, language, sources } = req.body as {
    projectId?: string;
    keyword?: string;
    language?: string;
    sources?: string[];
  };
  if (!projectId || !keyword) throw new AppError(400, 'projectId and keyword are required');
  const data = await searchMonitoring({
    projectId,
    keyword,
    language: language ?? 'ko',
    sources: sources as Parameters<typeof searchMonitoring>[0]['sources'],
  });
  res.json({ success: true, data }); // { items }
});

/**
 * POST /api/mkt/monitoring/comment
 * Body: { contentText, platform?, tone?, language?, projectContext? }
 * Generates a natural comment via Gemini. A missing Gemini key throws and bubbles
 * to errorMiddleware (mapped to 502/500) — intentionally NOT caught here.
 */
export const monitoringComment = asyncHandler(async (req: Request, res: Response) => {
  const { contentText, platform, tone, language, projectContext } = req.body as {
    contentText?: string;
    platform?: string;
    tone?: string;
    language?: string;
    projectContext?: string;
  };
  if (!contentText) throw new AppError(400, 'contentText is required');
  const data = await monitoringCommentSvc({
    contentText,
    platform: platform ?? 'naver_blog',
    tone: tone ?? 'friendly',
    language: language ?? 'ko',
    projectContext,
  });
  res.json({ success: true, data }); // { comment }
});
