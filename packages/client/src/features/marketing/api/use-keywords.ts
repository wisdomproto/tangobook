// Row interfaces are defined locally below — do NOT import server types into the client bundle.

async function postKeywords<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: { keywords?: T };
    error?: string;
  };
  if (!res.ok || !json.success) {
    throw new Error(json.error || `키워드 조회 실패 (HTTP ${res.status})`);
  }
  return (json.data?.keywords ?? []) as T;
}

export interface NaverKeywordRow {
  keyword: string;
  pcSearchVolume: number;
  mobileSearchVolume: number;
  totalSearchVolume: number;
  competition: 'HIGH' | 'MEDIUM' | 'LOW';
  pcClickCount: number;
  mobileClickCount: number;
  plAvgDepth: number;
}
export interface GoogleKeywordRow {
  keyword: string;
  searchVolume: number;
  competition: number;
  cpc: number;
}

export function fetchNaverKeywords(keywords: string[]): Promise<NaverKeywordRow[]> {
  return postKeywords<NaverKeywordRow[]>('/api/mkt/naver/keywords', { keywords });
}

export function fetchGoogleKeywords(
  keywords: string[],
  locationCode?: number,
  languageCode?: string
): Promise<GoogleKeywordRow[]> {
  return postKeywords<GoogleKeywordRow[]>('/api/mkt/google/keywords', {
    keywords,
    locationCode,
    languageCode,
  });
}
