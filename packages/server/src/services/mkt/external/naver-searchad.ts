import crypto from 'crypto';
import { config } from '../../../config/index.js';
import { AppError } from '../../../middleware/error.middleware.js';

const BASE_URL = 'https://api.searchad.naver.com';

export interface NaverKeyword {
  keyword: string;
  pcSearchVolume: number;
  mobileSearchVolume: number;
  totalSearchVolume: number;
  competition: 'HIGH' | 'MEDIUM' | 'LOW';
  pcClickCount: number;
  mobileClickCount: number;
  plAvgDepth: number;
}

/** Naver AD API signature: Base64(HMAC-SHA256(secret, `${timestamp}.${method}.${uri}`)). */
export function signNaverRequest(
  secretKey: string,
  timestamp: string,
  method: string,
  uri: string
): string {
  return crypto
    .createHmac('sha256', secretKey)
    .update(`${timestamp}.${method}.${uri}`)
    .digest('base64');
}

function toNum(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const digits = v.replace(/[^0-9.]/g, ''); // Naver returns "< 10"
    return digits ? Math.round(Number(digits)) : 0;
  }
  return 0;
}

function mapCompetition(compIdx: unknown): 'HIGH' | 'MEDIUM' | 'LOW' {
  const s = String(compIdx).toUpperCase();
  if (compIdx === '높음' || s === 'HIGH') return 'HIGH';
  if (compIdx === '낮음' || s === 'LOW') return 'LOW';
  return 'MEDIUM';
}

interface RawKeywordRow {
  relKeyword: string;
  monthlyPcQcCnt: unknown;
  monthlyMobileQcCnt: unknown;
  monthlyAvePcClkCnt: unknown;
  monthlyAveMobileClkCnt: unknown;
  compIdx: unknown;
  plAvgDepth: unknown;
}

export function mapKeywordList(rows: RawKeywordRow[]): NaverKeyword[] {
  return rows.map((r) => {
    const pc = toNum(r.monthlyPcQcCnt);
    const mobile = toNum(r.monthlyMobileQcCnt);
    return {
      keyword: r.relKeyword,
      pcSearchVolume: pc,
      mobileSearchVolume: mobile,
      totalSearchVolume: pc + mobile,
      competition: mapCompetition(r.compIdx),
      pcClickCount: toNum(r.monthlyAvePcClkCnt),
      mobileClickCount: toNum(r.monthlyAveMobileClkCnt),
      plAvgDepth: toNum(r.plAvgDepth),
    };
  });
}

/** Query Naver SearchAd /keywordstool for up to 5 hint keywords. */
export async function searchKeywords(keywords: string[]): Promise<NaverKeyword[]> {
  const { apiKey, secretKey, customerId } = config.naverAd;
  if (!apiKey || !secretKey || !customerId) {
    throw new AppError(502, 'Naver 키워드 API 키가 설정되지 않았습니다.');
  }
  const method = 'GET';
  const uri = '/keywordstool';
  const timestamp = Date.now().toString();
  const signature = signNaverRequest(secretKey, timestamp, method, uri);
  const hint = keywords
    .slice(0, 5)
    .map((k) => k.replace(/\s+/g, ''))
    .join(',');
  const qs = new URLSearchParams({ hintKeywords: hint, showDetail: '1' });

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${uri}?${qs.toString()}`, {
      method,
      headers: {
        'X-Timestamp': timestamp,
        'X-API-KEY': apiKey,
        'X-Customer': customerId,
        'X-Signature': signature,
      },
    });
  } catch (e) {
    throw new AppError(502, `Naver 키워드 조회 실패: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new AppError(502, `Naver 키워드 조회 실패 (${res.status}): ${body.slice(0, 200)}`);
  }
  const json = (await res.json()) as { keywordList?: RawKeywordRow[] };
  return mapKeywordList(json.keywordList ?? []);
}
