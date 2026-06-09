/**
 * Meta Graph API (Facebook / Instagram) — wired in Phase 4b.
 *
 * Endpoints used:
 *  - GET /{ig_id}?fields=… — Instagram account + media insights
 *  - GET /{page_id}?fields=… — Facebook page + post insights
 *  - GET /act_{ad_account_id}/insights — ad-level insights (thin, available but
 *    currently unused by the Phase-4 dashboard; wired per plan Chunk 8 step 3)
 *  - POST /oauth/access_token — token exchange (stub retained for Phase 5)
 *
 * Pure mappers (mapInstagramInsights / mapFacebookInsights) live in
 * analytics.service.ts so they can be tested independently without HTTP.
 */

import { AppError } from '../../../middleware/error.middleware.js';
import { config } from '../../../config/index.js';

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

/** Shape of a page entry inside `mkt_projects.meta_credentials`. */
export interface MetaPage {
  id: string;
  name?: string;
  pageAccessToken: string;
  instagram?: { id: string };
}

const GRAPH = 'https://graph.facebook.com/v21.0';

/**
 * Fetch raw Instagram account + recent media from the Graph API.
 * Returns raw JSON — pure mapping is done in analytics.service.ts.
 * Throws AppError(502) on Graph API errors.
 */
export async function getPageMediaInsights(
  page: MetaPage,
  platform: 'instagram' | 'facebook'
): Promise<{ raw: unknown }> {
  if (platform === 'instagram') {
    const igId = page.instagram?.id;
    if (!igId) {
      throw new AppError(400, 'Instagram ID가 연결되어 있지 않습니다.');
    }
    const url =
      `${GRAPH}/${igId}?fields=followers_count,media_count,media{id,caption,media_type,permalink,timestamp,like_count,comments_count,media_url}` +
      `&access_token=${page.pageAccessToken}`;
    const res = await fetch(url);
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
      throw new AppError(
        502,
        `Meta Graph API 오류 (IG ${res.status}): ${body?.error?.message ?? res.statusText}`
      );
    }
    return { raw: await res.json() };
  } else {
    // Facebook page posts
    const url =
      `${GRAPH}/${page.id}?fields=fan_count,posts{id,message,created_time,shares,likes.summary(true),comments.summary(true)}` +
      `&access_token=${page.pageAccessToken}`;
    const res = await fetch(url);
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
      throw new AppError(
        502,
        `Meta Graph API 오류 (FB ${res.status}): ${body?.error?.message ?? res.statusText}`
      );
    }
    return { raw: await res.json() };
  }
}

/**
 * Fetch ad insights from Meta Marketing API.
 * Available but not called by the Phase-4 dashboard (Phase 5+).
 * Wired per Chunk 8 plan step 3.
 */
export async function getAdInsights(
  adAccountId: string,
  datePreset: string,
  level: 'campaign' | 'adset' | 'ad'
): Promise<MetaAdInsight[]> {
  const appSecret = config.meta.appSecret;
  if (!appSecret) {
    // Graceful: ad insights require a system user token; Phase-5 concern.
    throw new AppError(501, 'Meta 광고 인사이트는 아직 연동되지 않았습니다 (Phase 5+).');
  }
  const url = `${GRAPH}/act_${adAccountId}/insights?level=${level}&date_preset=${datePreset}&fields=impressions,clicks,spend,reach,cpm,ctr,ad_id,ad_name`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
    throw new AppError(
      502,
      `Meta Ads 인사이트 오류 (${res.status}): ${body?.error?.message ?? res.statusText}`
    );
  }
  const data = (await res.json()) as {
    data?: Array<{
      ad_id?: string;
      ad_name?: string;
      impressions?: string;
      clicks?: string;
      spend?: string;
      reach?: string;
      cpm?: string;
      ctr?: string;
    }>;
  };
  return (data.data ?? []).map((row) => ({
    adId: row.ad_id ?? '',
    adName: row.ad_name ?? '',
    impressions: parseInt(row.impressions ?? '0', 10),
    clicks: parseInt(row.clicks ?? '0', 10),
    spend: parseFloat(row.spend ?? '0'),
    reach: parseInt(row.reach ?? '0', 10),
    cpm: parseFloat(row.cpm ?? '0'),
    ctr: parseFloat(row.ctr ?? '0'),
  }));
}

/**
 * Exchange a short-lived token for a long-lived page access token.
 * Phase 5+: token management UI.
 */
export async function exchangeToken(shortLivedToken: string): Promise<string> {
  const { appId, appSecret } = config.meta;
  if (!appId || !appSecret) {
    throw new AppError(501, 'Meta 앱 설정(APP_ID/APP_SECRET)이 필요합니다.');
  }
  const url =
    `${GRAPH}/oauth/access_token?grant_type=fb_exchange_token` +
    `&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
    throw new AppError(
      502,
      `Meta 토큰 교환 실패 (${res.status}): ${body?.error?.message ?? res.statusText}`
    );
  }
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new AppError(502, 'Meta 토큰 교환: access_token 누락');
  }
  return data.access_token;
}
