export interface StrategyTemplateMeta {
  filename: string;
  title: string;
  description: string;
  size: number;
  modifiedAt: string;
  url: string;
}

// Client view-model mirroring the server `FeedItem` shape 1:1
// (packages/server/src/services/mkt/monitoring.service.ts).
export interface MonitoringFeedItem {
  platform: 'naver_jisikin' | 'naver_blog' | 'wordpress' | 'youtube' | 'instagram';
  id: string;
  title: string;
  snippet: string;
  author: string;
  url?: string;
  thumbnail?: string;
  publishedAt?: string;
  language: string;
  views?: string;
  engagement?: { likes: number; comments: number };
}
