/**
 * DataForSEO API — Phase 2+ skeleton.
 *
 * Will use config.dataforseo.{login, password} via HTTP Basic Auth.
 *
 * Endpoints planned:
 *  - POST /v3/keywords_data/google/search_volume/live — Google 검색량
 *  - POST /v3/serp/google/organic/live/advanced — SERP 순위 분석
 *  - POST /v3/backlinks/summary/live — 백링크 분석
 */

import { AppError } from '../../../middleware/error.middleware.js';

export interface KeywordVolume {
  keyword: string;
  searchVolume: number;
  competition: number; // 0–1
  cpc: number;
}

export interface SerpResult {
  keyword: string;
  url: string;
  rank: number;
  title: string;
  description: string;
}

export interface BacklinkSummary {
  target: string;
  totalBacklinks: number;
  referringDomains: number;
  domainRank: number;
}

/**
 * Fetch Google keyword search volumes from DataForSEO.
 * Phase 2+: currently throws 501 until wired.
 */
export async function getKeywordVolumes(
  _keywords: string[],
  _locationCode?: number,
  _languageCode?: string
): Promise<KeywordVolume[]> {
  throw new AppError(501, 'DataForSEO not wired yet (Phase 2+)');
}

/**
 * Fetch SERP results for a keyword from DataForSEO.
 * Phase 2+: currently throws 501 until wired.
 */
export async function getSerpResults(
  _keyword: string,
  _locationCode?: number
): Promise<SerpResult[]> {
  throw new AppError(501, 'DataForSEO not wired yet (Phase 2+)');
}

/**
 * Fetch backlink summary for a target domain/URL from DataForSEO.
 * Phase 2+: currently throws 501 until wired.
 */
export async function getBacklinkSummary(_target: string): Promise<BacklinkSummary> {
  throw new AppError(501, 'DataForSEO not wired yet (Phase 2+)');
}
