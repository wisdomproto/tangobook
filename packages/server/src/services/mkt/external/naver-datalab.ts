/**
 * Naver Datalab API (검색어 트렌드) — Phase 2+ skeleton.
 *
 * Will use config.naverDatalab.{clientId, secret} via X-Naver-Client-Id /
 * X-Naver-Client-Secret headers.
 *
 * Endpoint planned:
 *  - POST https://openapi.naver.com/v1/datalab/search — 검색어 트렌드 시계열
 */

import { AppError } from '../../../middleware/error.middleware.js';

export interface DatalabGroup {
  groupName: string;
  keywords: string[];
}

export interface DatalabDataPoint {
  period: string; // "YYYY-MM-DD"
  ratio: number; // 0–100
}

export interface DatalabResult {
  title: string;
  keywords: string[];
  data: DatalabDataPoint[];
}

/**
 * Fetch search trend data for keyword groups from Naver Datalab.
 * Phase 2+: currently throws 501 until wired.
 */
export async function searchTrend(
  _startDate: string,
  _endDate: string,
  _timeUnit: 'date' | 'week' | 'month',
  _groups: DatalabGroup[]
): Promise<DatalabResult[]> {
  throw new AppError(501, 'Naver Datalab not wired yet (Phase 2+)');
}
