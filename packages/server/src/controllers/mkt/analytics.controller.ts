import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { AppError } from '../../middleware/error.middleware.js';
import {
  resolveGa4Config,
  getOverview,
  getTraffic,
  getTopPages,
  getCountry,
  getContent,
} from '../../services/mkt/analytics.service.js';

/**
 * GA4 analytics controllers (server-proxy). Each takes `{ projectId, period? }`
 * (NOT creds — R-1/R-6: the GA4 private key never crosses the wire). The config
 * is resolved server-side; `resolveGa4Config` throws `AppError(501)` when GA4 is
 * unconfigured, which propagates as a graceful "연결 필요" state to the client.
 */

type AnalyticsBody = { projectId?: string; period?: '7d' | '30d' };

/** POST /api/mkt/analytics/overview  Body: { projectId, period? } */
export const analyticsOverview = asyncHandler(async (req: Request, res: Response) => {
  const { projectId, period } = req.body as AnalyticsBody;
  if (!projectId) throw new AppError(400, 'projectId is required');
  const cfg = await resolveGa4Config(projectId);
  const data = await getOverview(cfg, period ?? '7d');
  res.json({ success: true, data });
});

/** POST /api/mkt/analytics/traffic  Body: { projectId, period? } */
export const analyticsTraffic = asyncHandler(async (req: Request, res: Response) => {
  const { projectId, period } = req.body as AnalyticsBody;
  if (!projectId) throw new AppError(400, 'projectId is required');
  const cfg = await resolveGa4Config(projectId);
  const data = await getTraffic(cfg, period ?? '30d');
  res.json({ success: true, data });
});

/** POST /api/mkt/analytics/top-pages  Body: { projectId, period? } */
export const analyticsTopPages = asyncHandler(async (req: Request, res: Response) => {
  const { projectId, period } = req.body as AnalyticsBody;
  if (!projectId) throw new AppError(400, 'projectId is required');
  const cfg = await resolveGa4Config(projectId);
  const data = await getTopPages(cfg, period ?? '30d');
  res.json({ success: true, data });
});

/** POST /api/mkt/analytics/country-traffic  Body: { projectId, period? } */
export const analyticsCountryTraffic = asyncHandler(async (req: Request, res: Response) => {
  const { projectId, period } = req.body as AnalyticsBody;
  if (!projectId) throw new AppError(400, 'projectId is required');
  const cfg = await resolveGa4Config(projectId);
  const data = await getCountry(cfg, period ?? '30d');
  res.json({ success: true, data });
});

/** POST /api/mkt/analytics/content-performance  Body: { projectId, period? } */
export const analyticsContentPerformance = asyncHandler(async (req: Request, res: Response) => {
  const { projectId, period } = req.body as AnalyticsBody;
  if (!projectId) throw new AppError(400, 'projectId is required');
  const cfg = await resolveGa4Config(projectId);
  const data = await getContent(cfg, period ?? '30d');
  res.json({ success: true, data });
});
