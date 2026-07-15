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
  getSource,
  getLanguage,
  getNewReturning,
  getMembership,
  getDaily,
  getDevice,
  getHourly,
  getMetaInsights,
  getYoutubeChannel,
} from '../../services/mkt/analytics.service.js';

/**
 * GA4 analytics controllers (server-proxy). Each takes `{ projectId, period? }`
 * (NOT creds — R-1/R-6: the GA4 private key never crosses the wire). The config
 * is resolved server-side; `resolveGa4Config` throws `AppError(501)` when GA4 is
 * unconfigured, which propagates as a graceful "연결 필요" state to the client.
 */

type AnalyticsBody = { projectId?: string; period?: 'today' | 'yesterday' | '7d' | '30d' };

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

/** POST /api/mkt/analytics/source  Body: { projectId, period? } — 유입 소스/매체 */
export const analyticsSource = asyncHandler(async (req: Request, res: Response) => {
  const { projectId, period } = req.body as AnalyticsBody;
  if (!projectId) throw new AppError(400, 'projectId is required');
  const cfg = await resolveGa4Config(projectId);
  const data = await getSource(cfg, period ?? '7d');
  res.json({ success: true, data });
});

/** POST /api/mkt/analytics/language  Body: { projectId, period? } — 앱 UI 언어별(app_language 커스텀 디멘션) */
export const analyticsLanguage = asyncHandler(async (req: Request, res: Response) => {
  const { projectId, period } = req.body as AnalyticsBody;
  if (!projectId) throw new AppError(400, 'projectId is required');
  const cfg = await resolveGa4Config(projectId);
  const data = await getLanguage(cfg, period ?? '7d');
  res.json({ success: true, data });
});

/** POST /api/mkt/analytics/new-returning  Body: { projectId, period? } — 신규 vs 재방문 */
export const analyticsNewReturning = asyncHandler(async (req: Request, res: Response) => {
  const { projectId, period } = req.body as AnalyticsBody;
  if (!projectId) throw new AppError(400, 'projectId is required');
  const cfg = await resolveGa4Config(projectId);
  const data = await getNewReturning(cfg, period ?? '7d');
  res.json({ success: true, data });
});

/** POST /api/mkt/analytics/membership  Body: { projectId, period? } — 회원 vs 비회원(membership 커스텀 디멘션) */
export const analyticsMembership = asyncHandler(async (req: Request, res: Response) => {
  const { projectId, period } = req.body as AnalyticsBody;
  if (!projectId) throw new AppError(400, 'projectId is required');
  const cfg = await resolveGa4Config(projectId);
  const data = await getMembership(cfg, period ?? '7d');
  res.json({ success: true, data });
});

/** POST /api/mkt/analytics/daily  Body: { projectId, period? } — 날짜별 리치 지표 */
export const analyticsDaily = asyncHandler(async (req: Request, res: Response) => {
  const { projectId, period } = req.body as AnalyticsBody;
  if (!projectId) throw new AppError(400, 'projectId is required');
  const cfg = await resolveGa4Config(projectId);
  const data = await getDaily(cfg, period ?? '7d');
  res.json({ success: true, data });
});

/** POST /api/mkt/analytics/device  Body: { projectId, period? } — 디바이스 분포 */
export const analyticsDevice = asyncHandler(async (req: Request, res: Response) => {
  const { projectId, period } = req.body as AnalyticsBody;
  if (!projectId) throw new AppError(400, 'projectId is required');
  const cfg = await resolveGa4Config(projectId);
  const data = await getDevice(cfg, period ?? '7d');
  res.json({ success: true, data });
});

/** POST /api/mkt/analytics/hourly  Body: { projectId, period? } — 시간대별 세션 */
export const analyticsHourly = asyncHandler(async (req: Request, res: Response) => {
  const { projectId, period } = req.body as AnalyticsBody;
  if (!projectId) throw new AppError(400, 'projectId is required');
  const cfg = await resolveGa4Config(projectId);
  const data = await getHourly(cfg, period ?? '7d');
  res.json({ success: true, data });
});

/**
 * POST /api/mkt/analytics/meta-insights
 * Body: { projectId, platform, country? }
 *
 * R-1/R-6: Meta page access token is read server-side only via resolveMetaCredentials.
 * It is NEVER echoed back in the response. A 501 from resolveMetaCredentials propagates
 * as { success:false, error } → the client renders the "연결 필요" empty state.
 */
export const metaInsights = asyncHandler(async (req: Request, res: Response) => {
  const { projectId, platform, country } = req.body as {
    projectId?: string;
    platform?: string;
    country?: string;
  };
  if (!projectId || !platform) {
    throw new AppError(400, 'projectId and platform are required');
  }
  const data = await getMetaInsights(projectId, platform, country);
  res.json({ success: true, data });
});

/**
 * POST /api/mkt/analytics/youtube-channel
 * Body: { action, params? }
 *
 * Dispatches YouTube Data API actions (searchChannel / getChannel / getVideos /
 * getVideoStats). Returns raw Google JSON — the client hook assembles the view-model.
 * Requires YOUTUBE_DATA_API_KEY server-side; throws 502 when absent.
 */
export const youtubeChannel = asyncHandler(async (req: Request, res: Response) => {
  const { action, params } = req.body as {
    action?: string;
    params?: Record<string, unknown>;
  };
  if (!action) throw new AppError(400, 'action is required');
  const data = await getYoutubeChannel(action, params ?? {});
  res.json({ success: true, data });
});
