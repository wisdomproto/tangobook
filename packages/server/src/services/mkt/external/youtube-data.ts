/**
 * YouTube Data API v3 — Phase 3+ skeleton.
 *
 * Will use config.youtubeApiKey (Data API key — separate from the OAuth
 * credentials used for video uploads in the longform service).
 *
 * Endpoints planned:
 *  - GET /youtube/v3/search — 키워드 기반 영상 검색
 *  - GET /youtube/v3/videos — 영상 통계 (views, likes, comments)
 *  - GET /youtube/v3/channels — 채널 정보 및 구독자 수
 */

import { AppError } from '../../../middleware/error.middleware.js';

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

/**
 * Search YouTube videos by keyword.
 * Phase 3+: currently throws 501 until wired.
 */
export async function searchVideos(
  _query: string,
  _maxResults?: number
): Promise<YTVideoSnippet[]> {
  throw new AppError(501, 'YouTube Data API not wired yet (Phase 3+)');
}

/**
 * Fetch statistics for specific video IDs.
 * Phase 3+: currently throws 501 until wired.
 */
export async function getVideoStats(_videoIds: string[]): Promise<YTVideoStats[]> {
  throw new AppError(501, 'YouTube Data API not wired yet (Phase 3+)');
}

/**
 * Fetch channel information by channel ID.
 * Phase 3+: currently throws 501 until wired.
 */
export async function getChannelInfo(_channelId: string): Promise<YTChannelInfo> {
  throw new AppError(501, 'YouTube Data API not wired yet (Phase 3+)');
}
