/**
 * Naver Search AD API (파워링크 키워드 광고) — Phase 2+ skeleton.
 *
 * Will use config.naverAd.{apiKey, secretKey, customerId} and sign requests
 * with HMAC-SHA256 (Naver AD API auth spec).
 *
 * Endpoints planned:
 *  - GET /keywordstool — 키워드 통계 (월간 검색량, 경쟁도, 입찰가)
 *  - GET /nsp/keywords — 파워링크 키워드 목록 조회
 */

import { AppError } from '../../../middleware/error.middleware.js';

export interface NaverKeywordStat {
  keyword: string;
  monthlyPcQcCnt: number;
  monthlyMobileQcCnt: number;
  monthlyAvePcClkCnt: number;
  monthlyAveMobileClkCnt: number;
  plAvgDepth: number;
  compIdx: 'low' | 'medium' | 'high';
}

/**
 * Search for keyword statistics from Naver Search AD API.
 * Phase 2+: currently throws 501 until wired.
 */
export async function searchKeywords(_query: string): Promise<NaverKeywordStat[]> {
  throw new AppError(501, 'Naver SearchAD not wired yet (Phase 2+)');
}

/**
 * Fetch related keywords for a seed keyword.
 * Phase 2+: currently throws 501 until wired.
 */
export async function getRelatedKeywords(_seed: string): Promise<NaverKeywordStat[]> {
  throw new AppError(501, 'Naver SearchAD not wired yet (Phase 2+)');
}
