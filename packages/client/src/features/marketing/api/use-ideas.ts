import { useMutation } from '@tanstack/react-query';

// ─── Client-local types (do NOT import from server) ──────────────────────────

export interface Idea {
  channel: string;
  title: string;
  structure: string;
  outline: string[];
}

export interface YTVideo {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  url: string;
  views: string;
  viewCount: number;
  likes: number;
  comments: number;
  publishedAt: string;
  keyword: string;
}

export interface TrendItem {
  keyword: string;
  totalSearches?: number;
  compIdx?: string;
  trend?: string;
  change?: string;
}

export interface TrendingResult {
  youtube: YTVideo[];
  naverTrends: TrendItem[];
  googleTrends: TrendItem[];
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: T;
    error?: string;
  };
  if (!res.ok || !json.success || !json.data) {
    throw new Error(json.error || `요청 실패 (HTTP ${res.status})`);
  }
  return json.data;
}

interface GenerateIdeasBody {
  topic: string;
  channelTypes?: string[];
  industry?: string;
  targetAudience?: string;
}

/** Transient mutation — POST /api/mkt/ideas/generate */
export function useGenerateIdeas() {
  return useMutation({
    mutationFn: (body: GenerateIdeasBody) =>
      postJson<{ ideas: Idea[]; topic: string }>('/api/mkt/ideas/generate', body),
  });
}

interface TrendingBody {
  keywords: string[];
  language?: string;
  period?: 'week' | 'month' | 'quarter';
}

/** Transient mutation — POST /api/mkt/ideas/trending */
export function useTrending() {
  return useMutation({
    mutationFn: (body: TrendingBody) => postJson<TrendingResult>('/api/mkt/ideas/trending', body),
  });
}
