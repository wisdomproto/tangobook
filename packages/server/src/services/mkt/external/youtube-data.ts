/**
 * YouTube Data API v3 — wired in Phase 2.
 *
 * Uses config.youtubeApiKey (Data API key — separate from the OAuth
 * credentials used for video uploads in the longform service).
 *
 * Endpoints:
 *  - GET /youtube/v3/search — 키워드 기반 영상 검색
 *  - GET /youtube/v3/videos — 영상 통계 (views, likes, comments)
 *  - GET /youtube/v3/channels — 채널 정보 및 구독자 수 (Phase 3+)
 */

import { AppError } from '../../../middleware/error.middleware.js';
import { config } from '../../../config/index.js';

export interface YTVideoSnippet {
  videoId: string;
  title: string;
  description: string;
  channelTitle: string;
  publishedAt: string;
  thumbnailUrl: string;
}

export interface YTVideoStats {
  videoId: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
}

export interface YTChannelInfo {
  channelId: string;
  title: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
}

const YT_BASE = 'https://www.googleapis.com/youtube/v3';

interface SearchOptions {
  publishedAfter?: string;
  order?: 'relevance' | 'viewCount' | 'rating' | 'date';
  relevanceLanguage?: string;
  maxResults?: number;
}

/**
 * Search YouTube videos by keyword.
 * Requires config.youtubeApiKey — throws 502 when blank.
 */
export async function searchVideos(
  query: string,
  options: SearchOptions = {}
): Promise<YTVideoSnippet[]> {
  const apiKey = config.youtubeApiKey;
  if (!apiKey) throw new AppError(502, 'YouTube Data API 키가 설정되지 않았습니다.');

  const params = new URLSearchParams({
    part: 'snippet',
    q: query,
    type: 'video',
    order: options.order ?? 'viewCount',
    maxResults: String(options.maxResults ?? 5),
    key: apiKey,
  });
  if (options.publishedAfter) params.set('publishedAfter', options.publishedAfter);
  if (options.relevanceLanguage) params.set('relevanceLanguage', options.relevanceLanguage);

  const res = await fetch(`${YT_BASE}/search?${params}`);
  if (res.status === 403) {
    const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
    const msg = body?.error?.message ?? 'YouTube quota exceeded';
    throw new AppError(403, `YouTube Data API 오류: ${msg}`);
  }
  if (!res.ok) throw new AppError(res.status, `YouTube search failed: ${res.status}`);

  const data = (await res.json()) as {
    items?: Array<{
      id?: { videoId?: string };
      snippet?: {
        title?: string;
        description?: string;
        channelTitle?: string;
        publishedAt?: string;
        thumbnails?: { medium?: { url?: string }; default?: { url?: string } };
      };
    }>;
  };

  return (data.items ?? [])
    .filter((item) => item.id?.videoId)
    .map((item) => ({
      videoId: item.id!.videoId!,
      title: item.snippet?.title ?? '',
      description: item.snippet?.description ?? '',
      channelTitle: item.snippet?.channelTitle ?? '',
      publishedAt: item.snippet?.publishedAt ?? '',
      thumbnailUrl:
        item.snippet?.thumbnails?.medium?.url ?? item.snippet?.thumbnails?.default?.url ?? '',
    }));
}

/**
 * Fetch statistics for specific video IDs.
 * Requires config.youtubeApiKey — throws 502 when blank.
 */
export async function getVideoStats(videoIds: string[]): Promise<YTVideoStats[]> {
  const apiKey = config.youtubeApiKey;
  if (!apiKey) throw new AppError(502, 'YouTube Data API 키가 설정되지 않았습니다.');
  if (videoIds.length === 0) return [];

  const params = new URLSearchParams({
    part: 'statistics',
    id: videoIds.join(','),
    key: apiKey,
  });

  const res = await fetch(`${YT_BASE}/videos?${params}`);
  if (!res.ok) throw new AppError(res.status, `YouTube stats failed: ${res.status}`);

  const data = (await res.json()) as {
    items?: Array<{
      id?: string;
      statistics?: {
        viewCount?: string;
        likeCount?: string;
        commentCount?: string;
      };
    }>;
  };

  return (data.items ?? [])
    .filter((item) => item.id)
    .map((item) => ({
      videoId: item.id!,
      viewCount: parseInt(item.statistics?.viewCount ?? '0', 10),
      likeCount: parseInt(item.statistics?.likeCount ?? '0', 10),
      commentCount: parseInt(item.statistics?.commentCount ?? '0', 10),
    }));
}

/**
 * Fetch channel information by channel ID.
 * Phase 3+: currently throws 501 until wired.
 */
export async function getChannelInfo(_channelId: string): Promise<YTChannelInfo> {
  throw new AppError(501, 'YouTube channel info not wired yet (Phase 3+)');
}
