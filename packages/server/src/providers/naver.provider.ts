import crypto from 'node:crypto';
import { config } from '../config/index.js';

export interface NaverKeywordItem {
  relKeyword: string;
  monthlyPcQcCnt: number;
  monthlyMobileQcCnt: number;
  monthlyAvePcClkCnt: number;
  monthlyAveMobileClkCnt: number;
  monthlyAvePcCtr: number;
  monthlyAveMobileCtr: number;
  plAvgDepth: number;
  compIdx: string;
}

const BATCH_SIZE = 5;

function generateSignature(timestamp: number, method: string, uri: string): string {
  const message = `${timestamp}.${method}.${uri}`;
  return crypto.createHmac('sha256', config.naverAd.secretKey).update(message).digest('base64');
}

/** 단일 배치 API 호출 (최대 5개 키워드) */
async function fetchKeywordBatch(
  batch: string[],
  includeHintKeywords: boolean
): Promise<NaverKeywordItem[]> {
  const timestamp = Date.now();
  const method = 'GET';
  const uri = '/keywordstool';
  const signature = generateSignature(timestamp, method, uri);

  const url = new URL(`https://api.searchad.naver.com${uri}`);
  url.searchParams.set('hintKeywords', batch.join(','));
  url.searchParams.set('showDetail', '1');
  url.searchParams.set('includeHintKeywords', includeHintKeywords ? '1' : '0');

  const res = await fetch(url.toString(), {
    method,
    headers: {
      'X-API-KEY': config.naverAd.apiKey,
      'X-Customer': config.naverAd.customerId,
      'X-Timestamp': String(timestamp),
      'X-Signature': signature,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[Naver Ad API] ${res.status} ${res.statusText}`, body);
    return [];
  }

  const data = (await res.json()) as { keywordList: NaverKeywordItem[] };
  const list = data.keywordList ?? [];

  for (const item of list) {
    item.monthlyPcQcCnt = parseSearchCount(item.monthlyPcQcCnt);
    item.monthlyMobileQcCnt = parseSearchCount(item.monthlyMobileQcCnt);
  }

  return list;
}

/** 키워드 검색량 조회 — 5개씩 배치 처리 */
export async function searchKeywordTool(
  keywords: string[],
  includeHintKeywords = true
): Promise<NaverKeywordItem[]> {
  const { apiKey, secretKey, customerId } = config.naverAd;
  if (!apiKey || !secretKey || !customerId) return [];
  if (keywords.length === 0) return [];

  const results: NaverKeywordItem[] = [];

  for (let i = 0; i < keywords.length; i += BATCH_SIZE) {
    const batch = keywords.slice(i, i + BATCH_SIZE);
    const items = await fetchKeywordBatch(batch, includeHintKeywords);
    results.push(...items);
  }

  // 중복 키워드 제거 (배치 간 관련 키워드가 겹칠 수 있음)
  const seen = new Set<string>();
  return results.filter((item) => {
    if (seen.has(item.relKeyword)) return false;
    seen.add(item.relKeyword);
    return true;
  });
}

/** 네이버 API가 "< 10" 같은 문자열을 반환할 수 있으므로 숫자로 변환 */
function parseSearchCount(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const num = parseInt(value.replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? 0 : num;
  }
  return 0;
}
