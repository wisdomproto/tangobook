/**
 * Meta Graph API (Facebook / Instagram) — Phase 3+ skeleton.
 *
 * Will use config.meta.{appId, appSecret} to exchange tokens and call the
 * Marketing API / Insights API.
 *
 * Endpoints planned:
 *  - GET /act_{ad_account_id}/insights — 광고 성과 인사이트
 *  - GET /{page_id}/posts — 페이지 포스트 목록
 *  - POST /{page_id}/photos — 이미지 포스트 발행
 */

import { AppError } from '../../../middleware/error.middleware.js';

export interface MetaInsightMetric {
  name: string;
  value: string;
}

export interface MetaAdInsight {
  adId: string;
  adName: string;
  impressions: number;
  clicks: number;
  spend: number;
  reach: number;
  cpm: number;
  ctr: number;
}

/**
 * Fetch ad insights from Meta Marketing API.
 * Phase 3+: currently throws 501 until wired.
 */
export async function getAdInsights(
  _adAccountId: string,
  _datePreset: string,
  _level: 'campaign' | 'adset' | 'ad'
): Promise<MetaAdInsight[]> {
  throw new AppError(501, 'Meta Graph API not wired yet (Phase 3+)');
}

/**
 * Exchange a short-lived token for a long-lived page access token.
 * Phase 3+: currently throws 501 until wired.
 */
export async function exchangeToken(_shortLivedToken: string): Promise<string> {
  throw new AppError(501, 'Meta Graph API not wired yet (Phase 3+)');
}
