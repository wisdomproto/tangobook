// 콘텐츠 자산/배포 현황 집계 — dflo marketingStatusService 이식, tangobook 스키마 적응.
//  - 자산: 콘텐츠 × 언어 × [블로그/카드뉴스/릴스] 텍스트·이미지 준비 상태(complete/partial/none).
//    · 릴스는 mkt_instagram_contents.video_settings.reels[lang] 로 언어별 실측.
//    · 블로그/카드뉴스는 ko=원본(blog cards / ig cards+caption), 비-ko=mkt_translations status.
//  - 배포: mkt_publish_records 를 (content|kind|lang|channel) 채널별 최상위 상태로.
import { supabase } from '../api/supabase';
import type { Content } from '../types/database';

export const STATUS_LANGS = ['ko', 'en', 'zh', 'th', 'vi'] as const;
export type StatusLang = (typeof STATUS_LANGS)[number];
export const LANG_FLAG: Record<string, string> = {
  ko: '🇰🇷',
  en: '🇺🇸',
  zh: '🇨🇳',
  th: '🇹🇭',
  vi: '🇻🇳',
};

export type Readiness = 'complete' | 'partial' | 'none';
export interface Cell {
  status: Readiness;
  detail: string;
}
export interface ContentStatus {
  contentId: string;
  sortOrder: number;
  title: string;
  blog: Record<string, Cell>;
  cardnews: Record<string, Cell>;
  reels: Record<string, Cell>;
}

type AnyRec = Record<string, unknown>;
const NONE: Cell = { status: 'none', detail: '없음' };

// 비-ko 번역 상태 → 셀. completed=complete, 그 외 존재=partial, 없음=none.
function translationCell(status: string | undefined): Cell {
  if (!status) return NONE;
  if (status === 'completed') return { status: 'complete', detail: '번역 완료' };
  return { status: 'partial', detail: `번역 ${status}` };
}

export async function fetchContentStatus(contents: Content[]): Promise<ContentStatus[]> {
  const ids = contents.map((c) => c.id);
  if (ids.length === 0) return [];

  const [igC, blogC, trans] = await Promise.all([
    supabase
      .from('mkt_instagram_contents')
      .select('id, content_id, caption, video_settings')
      .in('content_id', ids),
    supabase.from('mkt_blog_contents').select('id, content_id').in('content_id', ids),
    supabase
      .from('mkt_translations')
      .select('content_id, language, channel_type, status')
      .in('content_id', ids),
  ]);

  const igContents = (igC.data ?? []) as AnyRec[];
  const blogContents = (blogC.data ?? []) as AnyRec[];
  const translations = (trans.data ?? []) as AnyRec[];

  // 카드/이미지 개수 bulk
  const igIds = igContents.map((r) => r.id as string);
  const blogIds = blogContents.map((r) => r.id as string);
  const [igCards, blogCards] = await Promise.all([
    igIds.length
      ? supabase
          .from('mkt_instagram_cards')
          .select('instagram_content_id, background_image_url')
          .in('instagram_content_id', igIds)
      : Promise.resolve({ data: [] as AnyRec[] }),
    blogIds.length
      ? supabase.from('mkt_blog_cards').select('blog_content_id').in('blog_content_id', blogIds)
      : Promise.resolve({ data: [] as AnyRec[] }),
  ]);

  // content_id → 카드뉴스(캡션·릴스·이미지수)
  const igByContent = new Map<
    string,
    { caption: string; reels: AnyRec; imgs: number; cards: number }
  >();
  const igImgCount = new Map<string, { imgs: number; cards: number }>();
  for (const c of (igCards.data ?? []) as AnyRec[]) {
    const k = c.instagram_content_id as string;
    const cur = igImgCount.get(k) ?? { imgs: 0, cards: 0 };
    cur.cards++;
    if (c.background_image_url) cur.imgs++;
    igImgCount.set(k, cur);
  }
  for (const r of igContents) {
    const cnt = igImgCount.get(r.id as string) ?? { imgs: 0, cards: 0 };
    igByContent.set(r.content_id as string, {
      caption: (r.caption as string) ?? '',
      reels: ((r.video_settings as AnyRec | null)?.reels as AnyRec) ?? {},
      imgs: cnt.imgs,
      cards: cnt.cards,
    });
  }

  // content_id → 블로그 카드 수
  const blogCardCount = new Map<string, number>();
  const blogContentByContent = new Map<string, string>(); // content_id → blog_content id
  for (const b of blogContents) blogContentByContent.set(b.content_id as string, b.id as string);
  const blogCardByBlog = new Map<string, number>();
  for (const bc of (blogCards.data ?? []) as AnyRec[]) {
    const k = bc.blog_content_id as string;
    blogCardByBlog.set(k, (blogCardByBlog.get(k) ?? 0) + 1);
  }
  for (const [contentId, blogId] of blogContentByContent)
    blogCardCount.set(contentId, blogCardByBlog.get(blogId) ?? 0);

  // content_id → { lang → { blog?, cardnews? } } 번역 status
  const transByContent = new Map<string, Map<string, { blog?: string; cardnews?: string }>>();
  for (const t of translations) {
    const cid = t.content_id as string;
    const lang = t.language as string;
    const ct = String(t.channel_type ?? '');
    const st = t.status as string;
    if (!transByContent.has(cid)) transByContent.set(cid, new Map());
    const langMap = transByContent.get(cid)!;
    if (!langMap.has(lang)) langMap.set(lang, {});
    const slot = langMap.get(lang)!;
    if (ct.includes('blog') || ct === 'self_hosted' || ct === 'naver_blog') slot.blog = st;
    else if (ct.includes('card') || ct === 'instagram') slot.cardnews = st;
  }

  return contents
    .map((c) => {
      const ig = igByContent.get(c.id);
      const blogCards = blogCardCount.get(c.id) ?? 0;
      const hasBlog = blogContentByContent.has(c.id);
      const trans = transByContent.get(c.id);

      const blog: Record<string, Cell> = {};
      const cardnews: Record<string, Cell> = {};
      const reels: Record<string, Cell> = {};

      for (const lang of STATUS_LANGS) {
        // 릴스 — 언어별 실측
        const reel = (ig?.reels?.[lang] as AnyRec | undefined) ?? undefined;
        const v = !!reel?.videoUrl;
        const cover = !!reel?.coverUrl;
        reels[lang] =
          !v && !cover
            ? NONE
            : {
                status: v && cover ? 'complete' : 'partial',
                detail: `영상${v ? '✓' : '✗'} 커버${cover ? '✓' : '✗'}`,
              };

        if (lang === 'ko') {
          blog[lang] = hasBlog
            ? blogCards > 0
              ? { status: 'complete', detail: `본문✓ 카드 ${blogCards}` }
              : { status: 'partial', detail: '본문만' }
            : NONE;
          const cap = !!ig?.caption?.trim();
          const imgs = ig?.imgs ?? 0;
          const cards = ig?.cards ?? 0;
          cardnews[lang] =
            !cap && imgs === 0
              ? NONE
              : cap && cards > 0 && imgs === cards
                ? { status: 'complete', detail: `캡션✓ 이미지 ${imgs}/${cards}` }
                : { status: 'partial', detail: `캡션${cap ? '✓' : '✗'} 이미지 ${imgs}/${cards}` };
        } else {
          blog[lang] = translationCell(trans?.get(lang)?.blog);
          cardnews[lang] = translationCell(trans?.get(lang)?.cardnews);
        }
      }

      return { contentId: c.id, sortOrder: c.sort_order, title: c.title, blog, cardnews, reels };
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

// ── 배포(발행 큐) 상태 ───────────────────────────────────────────────────────
export type PublishReadiness = 'published' | 'scheduled' | 'queued' | 'failed' | 'none';
const PUB_RANK: Record<PublishReadiness, number> = {
  published: 5,
  failed: 4,
  scheduled: 3,
  queued: 2,
  none: 1,
};
export const PUB_RANK_EXPORT = PUB_RANK;

export const CHANNELS_BY_KIND: Record<'blog' | 'cardnews' | 'reels', string[]> = {
  blog: ['self_hosted', 'naver_blog'],
  cardnews: ['instagram', 'facebook', 'threads'],
  reels: ['instagram', 'facebook', 'threads', 'youtube'],
};
export const CHAN_COLOR: Record<string, string> = {
  instagram: '#e1306c',
  facebook: '#1877f2',
  threads: '#111827',
  self_hosted: '#7c3aed',
  naver_blog: '#03c75a',
  youtube: '#ff0000',
};
export const CHAN_LABEL: Record<string, string> = {
  instagram: 'IG',
  facebook: 'FB',
  threads: 'Threads',
  self_hosted: '자체사이트',
  naver_blog: '네이버',
  youtube: 'YT',
};

function kindOfRecord(
  channel: string,
  contentKind: string | undefined
): 'blog' | 'cardnews' | 'reels' | null {
  if (channel === 'self_hosted' || channel === 'naver_blog') return 'blog';
  if (contentKind === 'reels') return 'reels';
  if (contentKind === 'cardnews') return 'cardnews';
  // 메타 채널 + kind 미상 → 카드뉴스로 간주
  if (['instagram', 'facebook', 'threads'].includes(channel)) return 'cardnews';
  if (channel === 'youtube') return 'reels';
  return null;
}

export async function fetchPublishStatus(
  projectId: string
): Promise<Map<string, PublishReadiness>> {
  const m = new Map<string, PublishReadiness>();
  const { data } = await supabase
    .from('mkt_publish_records')
    .select('content_id, channel, language, status, metadata')
    .eq('project_id', projectId);
  for (const it of (data ?? []) as AnyRec[]) {
    const contentId = it.content_id as string;
    const channel = it.channel as string;
    const lang = (it.language as string) ?? 'ko';
    const kind = kindOfRecord(
      channel,
      (it.metadata as AnyRec | null)?.content_kind as string | undefined
    );
    if (!contentId || !kind) continue;
    const s = it.status as string;
    const cur: PublishReadiness =
      s === 'published'
        ? 'published'
        : s === 'failed'
          ? 'failed'
          : s === 'scheduled'
            ? 'scheduled'
            : 'queued';
    const key = `${contentId}|${kind}|${lang}|${channel}`;
    const prev = m.get(key);
    if (!prev || PUB_RANK[cur] > PUB_RANK[prev]) m.set(key, cur);
  }
  return m;
}
