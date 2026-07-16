// src/types/analytics.ts

// --- 퍼널 설정 ---
export interface FunnelConfig {
  websiteUrl: string;
  conversionGoal: string;
  conversionUrl?: string;
  funnelSteps?: FunnelStep[];
}

export interface FunnelStep {
  name: string;
  url?: string;
  description?: string;
}

// --- GA4 설정 ---
export interface GA4Config {
  propertyId: string;
  clientEmail: string;
  privateKey: string;
}

// --- GA4 응답 데이터 ---
export interface GA4OverviewData {
  period: string;
  totalSessions: number;
  totalUsers: number;
  totalPageviews: number;
  bounceRate: number;
  avgSessionDuration: number;
  dailyPageviews: { date: string; views: number }[];
}

export interface GA4TrafficSource {
  channel: string;
  sessions: number;
  users: number;
  percentage: number;
}

export interface GA4TopPage {
  path: string;
  title: string;
  views: number;
  users: number;
}

// 동화책별 인기 — 서버가 pagePath 를 책 id 로 묶어서 반환 (analytics.service.ts mapTopBooks).
export interface GA4BookRow {
  bookId: string;
  title: string; // GA4 pageTitle 폴백 — 클라에서 실제 책 제목/커버로 보강
  views: number;
  users: number;
  sessions: number;
  avgDuration: number; // 세션 가중 평균(초)
}
export interface GA4TopBooksResult {
  books: GA4BookRow[];
  others: GA4TopPage[]; // 비-책 페이지(랜딩·라이브러리 허브·게임 등)
}

// PWA "홈에 설치" 누적 — installs=실설치(Android/데스크톱), standaloneUsers=홈 실행 기기(iOS 포함 추정)
export interface GA4PwaInstalls {
  installs: number;
  standaloneUsers: number;
}

// --- 임포트된 전략 데이터 ---
export interface ImportedStrategy {
  importedAt: string;
  sourceFileName: string;
  keywords: ImportedKeyword[];
  categories: ImportedCategory[];
}

export interface ImportedKeyword {
  keyword: string;
  totalSearch: number;
  competition: 'high' | 'medium' | 'low';
  isGolden: boolean;
  category?: string;
}

export interface ImportedCategory {
  code: string;
  name: string;
  description: string;
  topics: ImportedTopic[];
}

export interface ImportedTopic {
  id: string;
  title: string;
  angle?: string;
  keywords: string[];
  channels: string[];
  status: 'new' | 'done' | 'similar';
}

// --- GA4 country / content (new dimensions) ---
export interface GA4CountryRow {
  country: string;
  sessions: number;
  users: number;
}
export interface GA4ContentRow {
  path: string;
  sessions: number;
  avgDuration: number;
  bounceRate: number;
}
export interface GA4DailyRow {
  date: string; // YYYYMMDD
  pv: number;
  users: number;
  newUsers: number;
  avgSessionSec: number;
  engagementSec: number;
}
export interface GA4HourRow {
  hour: number; // 0~23
  sessions: number;
}

// --- Meta channel analytics ---
export interface MetaContentMetric {
  id: string;
  title: string;
  type: string;
  date: string;
  reach: number;
  impressions: number;
  engagement: number;
  engagementRate: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
}
export interface MetaOverviewMetrics {
  followers: number;
  followersGrowth: number;
  totalReach: number;
  reachGrowth: number;
  totalEngagement: number;
  engagementGrowth: number;
  avgEngagementRate: number;
  postsCount: number;
}
export interface MetaInsightsResult {
  connected: boolean;
  overview: MetaOverviewMetrics;
  contents: MetaContentMetric[];
}
export interface YoutubeChannelStat {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  subscribers: number;
  viewCount: number;
  videoCount: number;
  avgViews: number;
}

// --- Competitors ---
export interface CompetitorGapItem {
  topic: string;
  monthlySearch: number;
  competitors: string[];
  difficulty: string;
  priority: string;
}
export interface CompetitorStrengthItem {
  topic: string;
  monthlySearch: number;
  note: string;
}
export interface CompetitorRankingItem {
  keyword: string;
  myRank: number | null;
  volume?: number;
  competitors: { name: string; rank: number | null }[];
}
export interface SuggestedCompetitor {
  name: string;
  url?: string;
  type: string;
  reason: string;
  strength: string;
}

// --- SEO audit ---
export interface SeoAuditResult {
  url: string;
  title: string;
  metaDescription: string;
  scores: { google: number; naver: number; geo: number; tech: number };
  issues: { severity: string; message: string; engine: string; fix_action?: string }[];
  meta: Record<string, unknown>;
}

// --- 주간 보고서 ---
export interface WeeklyReportData {
  projectName: string;
  period: { start: string; end: string };
  analytics?: {
    sessions: number;
    sessionsDelta: number;
    users: number;
    usersDelta: number;
    pageviews: number;
    pageviewsDelta: number;
    bounceRate: number;
    topPages: GA4TopPage[];
    trafficSources: GA4TrafficSource[];
    dailyPageviews: { date: string; views: number }[];
  };
  content: {
    totalCreated: number;
    totalPublished: number;
    byChannel: { channel: string; count: number }[];
    recentItems: { title: string; channel: string; status: string; date: string }[];
  };
  keywords?: {
    tracked: number;
    goldenKeywords: string[];
  };
}
