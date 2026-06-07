import { config } from '../../../config/index.js';
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

interface RawVolumeRow {
  keyword: string;
  search_volume: number | null;
  competition: number | null;
  cpc: number | null;
}

export function mapVolumeResult(rows: RawVolumeRow[]): KeywordVolume[] {
  return rows.map((r) => ({
    keyword: r.keyword,
    searchVolume: r.search_volume ?? 0,
    competition: r.competition ?? 0,
    cpc: r.cpc ?? 0,
  }));
}

export async function getKeywordVolumes(
  keywords: string[],
  locationCode = 2410, // South Korea
  languageCode = 'ko'
): Promise<KeywordVolume[]> {
  const { login, password } = config.dataforseo;
  if (!login || !password) {
    throw new AppError(502, 'DataForSEO 자격 증명이 설정되지 않았습니다.');
  }
  const auth = 'Basic ' + Buffer.from(`${login}:${password}`).toString('base64');
  const body = [{ keywords, location_code: locationCode, language_code: languageCode }];

  let res: Response;
  try {
    res = await fetch('https://api.dataforseo.com/v3/keywords_data/google/search_volume/live', {
      method: 'POST',
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw new AppError(502, `Google 키워드 조회 실패: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new AppError(502, `Google 키워드 조회 실패 (${res.status}): ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as { tasks?: Array<{ result?: RawVolumeRow[] }> };
  return mapVolumeResult(json.tasks?.[0]?.result ?? []);
}

/**
 * Fetch SERP results for a keyword from DataForSEO.
 * Phase 3+: currently throws 501 until wired.
 */
export async function getSerpResults(
  _keyword: string,
  _locationCode?: number
): Promise<SerpResult[]> {
  throw new AppError(501, 'DataForSEO SERP not wired yet (Phase 3+)');
}

/**
 * Fetch backlink summary for a target domain/URL from DataForSEO.
 * Phase 3+: currently throws 501 until wired.
 */
export async function getBacklinkSummary(_target: string): Promise<BacklinkSummary> {
  throw new AppError(501, 'DataForSEO backlinks not wired yet (Phase 3+)');
}
