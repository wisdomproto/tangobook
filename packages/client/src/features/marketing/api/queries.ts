import { supabase } from './supabase';
import type {
  Project,
  Content,
  BaseArticle,
  BlogContent,
  BlogCard,
  InstagramContent,
  InstagramCard,
  ThreadsContent,
  ThreadsCard,
  YoutubeContent,
  YoutubeCard,
} from '../types/database';

// ─── Query Key Factory ──────────────────────────────────────────────────────

export const mktKeys = {
  all: ['mkt'] as const,
  projects: () => ['mkt', 'projects'] as const,
  project: (id: string) => ['mkt', 'project', id] as const,
  contents: (projectId: string) => ['mkt', 'contents', projectId] as const,
  content: (id: string) => ['mkt', 'content', id] as const,
  translation: (contentId: string, channel: string, lang: string) =>
    ['mkt', 'translation', contentId, channel, lang] as const,
  translationHtml: (contentId: string, channel: string, lang: string) =>
    ['mkt', 'translation-html', contentId, channel, lang] as const,
  cardTemplates: (projectId: string) => ['mkt', 'card-templates', projectId] as const,
  cardHiddenBuiltins: (projectId: string) => ['mkt', 'card-hidden-builtins', projectId] as const,
  savedKeywords: (projectId: string) => ['mkt', 'saved-keywords', projectId] as const,
  publishRecords: (projectId: string) => ['mkt', 'publish-records', projectId] as const,
  publishCounts: (projectId: string) => ['mkt', 'publish-counts', projectId] as const,
  analyticsOverview: (projectId: string, period: string) =>
    ['mkt', 'analytics', 'overview', projectId, period] as const,
  analyticsTraffic: (projectId: string, period: string) =>
    ['mkt', 'analytics', 'traffic', projectId, period] as const,
  analyticsTopPages: (projectId: string, period: string) =>
    ['mkt', 'analytics', 'top-pages', projectId, period] as const,
  analyticsTopBooks: (projectId: string, period: string) =>
    ['mkt', 'analytics', 'top-books', projectId, period] as const,
  analyticsPwaInstalls: (projectId: string) =>
    ['mkt', 'analytics', 'pwa-installs', projectId] as const,
  analyticsCountry: (projectId: string, period: string) =>
    ['mkt', 'analytics', 'country', projectId, period] as const,
  analyticsContent: (projectId: string, period: string) =>
    ['mkt', 'analytics', 'content', projectId, period] as const,
  analyticsSource: (projectId: string, period: string) =>
    ['mkt', 'analytics', 'source', projectId, period] as const,
  analyticsLanguage: (projectId: string, period: string) =>
    ['mkt', 'analytics', 'language', projectId, period] as const,
  analyticsNewReturning: (projectId: string, period: string) =>
    ['mkt', 'analytics', 'new-returning', projectId, period] as const,
  analyticsMembership: (projectId: string, period: string) =>
    ['mkt', 'analytics', 'membership', projectId, period] as const,
  analyticsDaily: (projectId: string, period: string) =>
    ['mkt', 'analytics', 'daily', projectId, period] as const,
  analyticsDevice: (projectId: string, period: string) =>
    ['mkt', 'analytics', 'device', projectId, period] as const,
  analyticsHourly: (projectId: string, period: string) =>
    ['mkt', 'analytics', 'hourly', projectId, period] as const,
  metaInsights: (projectId: string, platform: string, country: string) =>
    ['mkt', 'analytics', 'meta', projectId, platform, country] as const,
  youtubeChannel: (projectId: string, query: string) =>
    ['mkt', 'analytics', 'yt-channel', projectId, query] as const,
  youtubeOwn: (channelName: string, days: number) =>
    ['mkt', 'analytics', 'yt-own', channelName, days] as const,
  strategyTemplates: () => ['mkt', 'strategy', 'templates'] as const,
  monitoringKeywords: (projectId: string) => ['mkt', 'monitoring', 'keywords', projectId] as const,
  feedback: () => ['mkt', 'feedback'] as const,
  pipeline: () => ['mkt', 'pipeline'] as const,
};

// ─── Fetch Helpers ──────────────────────────────────────────────────────────

export async function fetchProjects(): Promise<Project[]> {
  const { data, error } = await supabase.from('mkt_projects').select('*').order('sort_order');
  if (error) throw new Error(error.message);
  return (data ?? []) as Project[];
}

export async function fetchProject(id: string): Promise<Project> {
  const { data, error } = await supabase.from('mkt_projects').select('*').eq('id', id).single();
  if (error) throw new Error(error.message);
  return data as Project;
}

export async function fetchContents(projectId: string): Promise<Content[]> {
  const { data, error } = await supabase
    .from('mkt_contents')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order');
  if (error) throw new Error(error.message);
  return (data ?? []) as Content[];
}

// ─── Content Graph ─────────────────────────────────────────────────────────

export interface ContentGraph {
  content: Content;
  baseArticle: BaseArticle | null;
  blogContents: Array<BlogContent & { cards: BlogCard[] }>;
  instagramContents: Array<InstagramContent & { cards: InstagramCard[] }>;
  threadsContents: Array<ThreadsContent & { cards: ThreadsCard[] }>;
  youtubeContents: Array<YoutubeContent & { cards: YoutubeCard[] }>;
}

export async function fetchContentGraph(contentId: string): Promise<ContentGraph> {
  // Fetch the content itself first
  const { data: content, error: contentErr } = await supabase
    .from('mkt_contents')
    .select('*')
    .eq('id', contentId)
    .single();
  if (contentErr) throw new Error(contentErr.message);

  // Fetch all channel data in parallel
  const [baseRes, blogRes, igRes, thRes, ytRes] = await Promise.all([
    supabase.from('mkt_base_articles').select('*').eq('content_id', contentId).maybeSingle(),
    supabase.from('mkt_blog_contents').select('*').eq('content_id', contentId).order('created_at'),
    supabase
      .from('mkt_instagram_contents')
      .select('*')
      .eq('content_id', contentId)
      .order('created_at'),
    supabase
      .from('mkt_threads_contents')
      .select('*')
      .eq('content_id', contentId)
      .order('created_at'),
    supabase
      .from('mkt_youtube_contents')
      .select('*')
      .eq('content_id', contentId)
      .order('created_at'),
  ]);

  if (baseRes.error) throw new Error(baseRes.error.message);
  if (blogRes.error) throw new Error(blogRes.error.message);
  if (igRes.error) throw new Error(igRes.error.message);
  if (thRes.error) throw new Error(thRes.error.message);
  if (ytRes.error) throw new Error(ytRes.error.message);

  const blogIds = (blogRes.data ?? []).map((b) => b.id);
  const igIds = (igRes.data ?? []).map((i) => i.id);
  const thIds = (thRes.data ?? []).map((t) => t.id);
  const ytIds = (ytRes.data ?? []).map((y) => y.id);

  // Fetch cards in parallel (only if there are parent rows)
  const [blogCardsRes, igCardsRes, thCardsRes, ytCardsRes] = await Promise.all([
    blogIds.length > 0
      ? supabase
          .from('mkt_blog_cards')
          .select('*')
          .in('blog_content_id', blogIds)
          .order('sort_order')
      : Promise.resolve({ data: [], error: null }),
    igIds.length > 0
      ? supabase
          .from('mkt_instagram_cards')
          .select('*')
          .in('instagram_content_id', igIds)
          .order('sort_order')
      : Promise.resolve({ data: [], error: null }),
    thIds.length > 0
      ? supabase
          .from('mkt_threads_cards')
          .select('*')
          .in('threads_content_id', thIds)
          .order('sort_order')
      : Promise.resolve({ data: [], error: null }),
    ytIds.length > 0
      ? supabase
          .from('mkt_youtube_cards')
          .select('*')
          .in('youtube_content_id', ytIds)
          .order('sort_order')
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (blogCardsRes.error) throw new Error(blogCardsRes.error.message);
  if (igCardsRes.error) throw new Error(igCardsRes.error.message);
  if (thCardsRes.error) throw new Error(thCardsRes.error.message);
  if (ytCardsRes.error) throw new Error(ytCardsRes.error.message);

  const blogCards = (blogCardsRes.data ?? []) as BlogCard[];
  const igCards = (igCardsRes.data ?? []) as InstagramCard[];
  const thCards = (thCardsRes.data ?? []) as ThreadsCard[];
  const ytCards = (ytCardsRes.data ?? []) as YoutubeCard[];

  return {
    content: content as Content,
    baseArticle: (baseRes.data as BaseArticle | null) ?? null,
    blogContents: ((blogRes.data ?? []) as BlogContent[]).map((bc) => ({
      ...bc,
      cards: blogCards.filter((c) => c.blog_content_id === bc.id),
    })),
    instagramContents: ((igRes.data ?? []) as InstagramContent[]).map((ic) => ({
      ...ic,
      cards: igCards.filter((c) => c.instagram_content_id === ic.id),
    })),
    threadsContents: ((thRes.data ?? []) as ThreadsContent[]).map((tc) => ({
      ...tc,
      cards: thCards.filter((c) => c.threads_content_id === tc.id),
    })),
    youtubeContents: ((ytRes.data ?? []) as YoutubeContent[]).map((yc) => ({
      ...yc,
      cards: ytCards.filter((c) => c.youtube_content_id === yc.id),
    })),
  };
}
