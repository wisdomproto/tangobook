import { useQuery, useMutation } from '@tanstack/react-query';
import { mktKeys } from './queries';
import type {
  GA4OverviewData,
  GA4TrafficSource,
  GA4TopPage,
  GA4CountryRow,
  GA4ContentRow,
  SeoAuditResult,
  MetaInsightsResult,
  MetaOverviewMetrics,
} from '../types/analytics';

// ─── Server-proxy POST helper ─────────────────────────────────────────────────
// Sends only safe data (projectId + period) to Express — never creds.
// On success ({ success: true, data }) → returns data.
// On 501 (GA4/Meta not connected) → returns null instead of throwing so the
// dashboard renders the "연결 필요" empty-state rather than an error banner.

async function postMkt<T>(path: string, body: unknown): Promise<T | null> {
  const res = await fetch('/api/mkt' + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  // 501 = GA4/Meta not configured — treat as "not connected", NOT an error.
  if (res.status === 501) {
    return null;
  }

  const json = (await res
    .json()
    .catch(() => ({}) as { success?: boolean; data?: T; error?: string })) as {
    success?: boolean;
    data?: T;
    error?: string;
    message?: string;
  };

  if (!res.ok || !json.success) {
    throw new Error(json.error || json.message || `요청 실패 (HTTP ${res.status})`);
  }

  return (json.data ?? null) as T | null;
}

// ─── GA4 query hooks ──────────────────────────────────────────────────────────
// Each hook is enabled only when `enabled` is true (defaults to !!projectId).
// The component passes `enabled = hasGa4 && !!projectId` so all five fire
// together only when GA4 is configured.
// staleTime = 5 min so switching period/project re-fetches but normal navigation hits cache.

const STALE_TIME = 5 * 60 * 1_000; // 5 minutes

/** POST /api/mkt/analytics/overview  Body: { projectId, period } */
export function useGa4Overview(
  projectId: string,
  period: '7d' | '30d' = '7d',
  enabled = !!projectId
) {
  return useQuery({
    queryKey: mktKeys.analyticsOverview(projectId, period),
    enabled: enabled && !!projectId,
    staleTime: STALE_TIME,
    queryFn: () => postMkt<GA4OverviewData>('/analytics/overview', { projectId, period }),
  });
}

/** POST /api/mkt/analytics/traffic  Body: { projectId, period } */
export function useGa4Traffic(
  projectId: string,
  period: '7d' | '30d' = '30d',
  enabled = !!projectId
) {
  return useQuery({
    queryKey: mktKeys.analyticsTraffic(projectId, period),
    enabled: enabled && !!projectId,
    staleTime: STALE_TIME,
    queryFn: () => postMkt<GA4TrafficSource[]>('/analytics/traffic', { projectId, period }),
  });
}

/** POST /api/mkt/analytics/top-pages  Body: { projectId, period } */
export function useGa4TopPages(
  projectId: string,
  period: '7d' | '30d' = '30d',
  enabled = !!projectId
) {
  return useQuery({
    queryKey: mktKeys.analyticsTopPages(projectId, period),
    enabled: enabled && !!projectId,
    staleTime: STALE_TIME,
    queryFn: () => postMkt<GA4TopPage[]>('/analytics/top-pages', { projectId, period }),
  });
}

/** POST /api/mkt/analytics/country-traffic  Body: { projectId, period } */
export function useGa4Country(
  projectId: string,
  period: '7d' | '30d' = '30d',
  enabled = !!projectId
) {
  return useQuery({
    queryKey: mktKeys.analyticsCountry(projectId, period),
    enabled: enabled && !!projectId,
    staleTime: STALE_TIME,
    queryFn: () => postMkt<GA4CountryRow[]>('/analytics/country-traffic', { projectId, period }),
  });
}

/** POST /api/mkt/analytics/content-performance  Body: { projectId, period } */
export function useGa4Content(
  projectId: string,
  period: '7d' | '30d' = '30d',
  enabled = !!projectId
) {
  return useQuery({
    queryKey: mktKeys.analyticsContent(projectId, period),
    enabled: enabled && !!projectId,
    staleTime: STALE_TIME,
    queryFn: () =>
      postMkt<GA4ContentRow[]>('/analytics/content-performance', { projectId, period }),
  });
}

// ─── Meta / YouTube hooks ────────────────────────────────────────────────────
// Meta: 501 (not connected) resolves to { connected: false, overview: DEFAULT, contents: [] }
// so the empty-state renders gracefully rather than throwing.

const DEFAULT_META_OVERVIEW: MetaOverviewMetrics = {
  followers: 0,
  followersGrowth: 0,
  totalReach: 0,
  reachGrowth: 0,
  totalEngagement: 0,
  engagementGrowth: 0,
  avgEngagementRate: 0,
  postsCount: 0,
};

const NOT_CONNECTED_RESULT: MetaInsightsResult = {
  connected: false,
  overview: DEFAULT_META_OVERVIEW,
  contents: [],
};

/**
 * POST /api/mkt/analytics/meta-insights  Body: { projectId, platform, country }
 * 501 → { connected: false, ... } (graceful empty-state, never a thrown error).
 */
export function useMetaInsights(
  projectId: string,
  platform: string,
  country: string,
  enabled?: boolean
) {
  return useQuery({
    queryKey: mktKeys.metaInsights(projectId, platform, country),
    enabled: (enabled ?? true) && !!projectId && !!platform,
    staleTime: STALE_TIME,
    queryFn: async (): Promise<MetaInsightsResult> => {
      const res = await fetch('/api/mkt/analytics/meta-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, platform, country }),
      });

      // 501 = Meta not connected → graceful empty state (not an error)
      if (res.status === 501) {
        return NOT_CONNECTED_RESULT;
      }

      const json = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        data?: MetaInsightsResult;
        error?: string;
        message?: string;
      };

      if (!res.ok || !json.success) {
        throw new Error(json.error || json.message || `요청 실패 (HTTP ${res.status})`);
      }

      // If the server returned connected:false (Threads etc.) pass through; else ensure connected:true
      return json.data ?? NOT_CONNECTED_RESULT;
    },
  });
}

/**
 * YouTube channel analysis mutation.
 * Orchestrates 4 sequential API actions:
 * searchChannel → getChannel → getVideos → getVideoStats
 * (faithful to CF meta-analytics-dashboard.tsx:187-267)
 */

export interface YoutubeVideoItem {
  id: string;
  title: string;
  thumbnail?: string;
  url: string;
  views: number;
  likes: number;
  comments: number;
  publishedAt: string;
}

export interface YoutubeChannelResult {
  channel: {
    id: string;
    title: string;
    description?: string;
    thumbnail?: string;
    subscribers: number;
    viewCount: number;
    videoCount: number;
    avgViews: number;
  };
  videos: YoutubeVideoItem[];
}

async function ytApi(projectId: string, action: string, params: Record<string, string | number>) {
  const res = await fetch('/api/mkt/analytics/youtube-channel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId, action, params }),
  });
  const json = (await res.json().catch(() => ({}))) as { success?: boolean; data?: unknown };
  if (!res.ok) throw new Error(`YouTube API 오류 (${res.status})`);
  return json.data ?? json;
}

export function useYoutubeChannel(projectId: string) {
  return useMutation({
    mutationFn: async (input: string): Promise<YoutubeChannelResult> => {
      let channelId = '';
      const trimmed = input.trim();

      // Extract channel id from URL (faithful to CF :198-208)
      if (trimmed.includes('youtube.com')) {
        const handleMatch = trimmed.match(/@([\w-]+)/);
        const idMatch = trimmed.match(/channel\/(UC[\w-]+)/);
        const query = idMatch?.[1] || handleMatch?.[1] || trimmed;
        const searchData = (await ytApi(projectId, 'searchChannel', { query })) as {
          items?: { id?: { channelId?: string }; snippet?: { channelId?: string } }[];
        };
        channelId =
          searchData.items?.[0]?.id?.channelId || searchData.items?.[0]?.snippet?.channelId || '';
      }

      if (!channelId) {
        const searchData = (await ytApi(projectId, 'searchChannel', { query: trimmed })) as {
          items?: { id?: { channelId?: string }; snippet?: { channelId?: string } }[];
        };
        channelId =
          searchData.items?.[0]?.id?.channelId || searchData.items?.[0]?.snippet?.channelId || '';
      }

      if (!channelId) throw new Error('채널을 찾을 수 없습니다');

      // Get channel details (faithful to CF :217-237)
      const channelData = (await ytApi(projectId, 'getChannel', { channelId })) as {
        items?: {
          statistics?: {
            subscriberCount?: string;
            viewCount?: string;
            videoCount?: string;
          };
          snippet?: {
            title?: string;
            description?: string;
            thumbnails?: { default?: { url?: string } };
          };
        }[];
      };
      const ch = channelData.items?.[0];
      if (!ch) throw new Error('채널 정보를 가져올 수 없습니다');

      const subscribers = parseInt(ch.statistics?.subscriberCount || '0');
      const viewCount = parseInt(ch.statistics?.viewCount || '0');
      const videoCount = parseInt(ch.statistics?.videoCount || '0');

      const channel = {
        id: channelId,
        title: ch.snippet?.title || '',
        description: ch.snippet?.description,
        thumbnail: ch.snippet?.thumbnails?.default?.url,
        subscribers,
        viewCount,
        videoCount,
        avgViews: videoCount > 0 ? Math.round(viewCount / videoCount) : 0,
      };

      // Get recent videos (faithful to CF :239-259)
      const videosData = (await ytApi(projectId, 'getVideos', {
        channelId,
        maxResults: 20,
      })) as {
        items?: {
          id?: { videoId?: string };
          snippet?: {
            title?: string;
            thumbnails?: { medium?: { url?: string } };
            publishedAt?: string;
          };
        }[];
      };

      let videos: YoutubeVideoItem[] = [];
      if (videosData.items?.length) {
        const videoIds = videosData.items
          .map((v) => v.id?.videoId)
          .filter(Boolean)
          .join(',');
        const statsData = (await ytApi(projectId, 'getVideoStats', { videoIds })) as {
          items?: { id?: string; statistics?: Record<string, string> }[];
        };
        const statsMap = new Map<string, Record<string, string>>(
          (statsData.items ?? []).map((s) => [s.id ?? '', s.statistics ?? {}])
        );

        videos = (videosData.items ?? []).map((v) => {
          const stats = statsMap.get(v.id?.videoId ?? '') ?? {};
          return {
            id: v.id?.videoId ?? '',
            title: v.snippet?.title ?? '',
            thumbnail: v.snippet?.thumbnails?.medium?.url,
            url: `https://www.youtube.com/watch?v=${v.id?.videoId}`,
            views: parseInt(stats.viewCount || '0'),
            likes: parseInt(stats.likeCount || '0'),
            comments: parseInt(stats.commentCount || '0'),
            publishedAt: v.snippet?.publishedAt
              ? new Date(v.snippet.publishedAt).toLocaleDateString('ko-KR')
              : '',
          };
        });
      }

      return { channel, videos };
    },
  });
}

// Export postMkt for use-competitors.ts
export { postMkt };

// ─── SEO mutations (transient) ────────────────────────────────────────────────
// These are triggered by user actions (URL submit / form submit) and are NOT
// cached in TanStack Query — they are transient mutations.

/** POST /api/mkt/seo/audit  Body: { url } */
export function useSeoAudit() {
  return useMutation({
    mutationFn: (url: string) =>
      postMkt<SeoAuditResult>('/seo/audit', { url }) as Promise<SeoAuditResult | null>,
  });
}

/** POST /api/mkt/seo/crawl  Body: { url } */
export function useSeoCrawl() {
  return useMutation({
    mutationFn: (url: string) =>
      postMkt<{ text: string; analysis?: unknown }>('/seo/crawl', { url }),
  });
}

/** POST /api/mkt/seo/schema-generate  Body: { content, schemaType, language? } */
export function useSchemaGenerate() {
  return useMutation({
    mutationFn: (args: { content: string; schemaType: string; language?: string }) =>
      postMkt<{ schema: string }>('/seo/schema-generate', args),
  });
}
