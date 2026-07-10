// 공개 블로그 서빙 — 발행된 self_hosted 내부 블로그를 외부(비로그인)에 노출.
// dflo blog_published(공개 read) 패턴을 tangobook 스키마로: 발행 여부는 mkt_publish_records
// (self_hosted, status='published') 로 판정하고, 본문은 mkt_blog_contents + mkt_blog_cards 를
// 서비스롤로 읽어(RLS 우회) 공개한다. 토큰/비공개 정보는 노출하지 않는다.
import { getSupabaseAdmin } from '../../providers/supabase-admin.provider.js';
import { AppError } from '../../middleware/error.middleware.js';

export interface BlogPostSummary {
  slug: string;
  title: string;
  description: string;
  category: string | null;
  publishedAt: string | null;
}

export interface BlogCardData {
  type: string; // text | image | divider | quote | list
  content: Record<string, unknown>;
}

export interface BlogPostDetail extends BlogPostSummary {
  cards: BlogCardData[];
  primaryKeyword: string | null;
  storybookId: string | null; // "동화책 보러가기" CTA 용
}

function admin() {
  const a = getSupabaseAdmin();
  if (!a) throw new AppError(502, 'Supabase 서비스 키가 설정되지 않았습니다.');
  return a;
}

/** 발행된(publish record published) content_id → 최신 published_at 맵. */
async function publishedContentMap(): Promise<Map<string, string>> {
  const sb = admin();
  const { data } = await sb
    .from('mkt_publish_records')
    .select('content_id, published_at')
    .eq('channel', 'self_hosted')
    .eq('status', 'published');
  const m = new Map<string, string>();
  for (const r of (data ?? []) as Array<{ content_id: string; published_at: string | null }>) {
    const cur = m.get(r.content_id);
    const at = r.published_at ?? '';
    if (!cur || at > cur) m.set(r.content_id, at);
  }
  return m;
}

export async function listPublishedBlogs(): Promise<BlogPostSummary[]> {
  const sb = admin();
  const pub = await publishedContentMap();
  if (pub.size === 0) return [];
  const ids = [...pub.keys()];

  const { data: blogs } = await sb
    .from('mkt_blog_contents')
    .select('content_id, title, seo_title, meta_description, url_slug')
    .eq('channel', 'self_hosted')
    .in('content_id', ids);
  const { data: contents } = await sb.from('mkt_contents').select('id, category').in('id', ids);
  const catById = new Map(
    ((contents ?? []) as Array<{ id: string; category: string | null }>).map((c) => [
      c.id,
      c.category,
    ])
  );

  return ((blogs ?? []) as Array<Record<string, unknown>>)
    .map((b) => {
      const contentId = b.content_id as string;
      return {
        slug: (b.url_slug as string) || contentId,
        title: (b.seo_title as string) || (b.title as string) || '(제목 없음)',
        description: (b.meta_description as string) || '',
        category: catById.get(contentId) ?? null,
        publishedAt: pub.get(contentId) ?? null,
      };
    })
    .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''));
}

/** 발행된 블로그의 url_slug(및 content_id 폴백) 집합. 교차 링크 유효성 판정용. */
async function publishedSlugSet(): Promise<Set<string>> {
  const sb = admin();
  const pub = await publishedContentMap();
  const set = new Set<string>();
  if (pub.size === 0) return set;
  const { data } = await sb
    .from('mkt_blog_contents')
    .select('content_id, url_slug')
    .eq('channel', 'self_hosted')
    .in('content_id', [...pub.keys()]);
  for (const r of (data ?? []) as Array<{ content_id: string; url_slug: string | null }>) {
    if (r.url_slug) set.add(r.url_slug);
    set.add(r.content_id);
  }
  return set;
}

/**
 * 본문 HTML 안의 교차 블로그 링크(<a href=".../blog/<slug>">)를 정리한다.
 * - 발행된 블로그 → 링크 유지
 * - 미발행(예약만 된) 블로그 → <a> 를 풀어 일반 텍스트로 (죽은 링크 방지)
 * - 블로그가 아닌 링크(동화책 CTA 등) → 그대로 유지
 * 매일 발행이 진행되면 미발행 링크가 자동으로 살아난다.
 */
function sanitizeCrossLinks(html: string, published: Set<string>): string {
  if (!html) return html;
  return html.replace(
    /<a\b[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi,
    (full, href: string, inner: string) => {
      const m = /\/blog\/([^/"'?#]+)/.exec(href);
      if (!m) return full; // 블로그 링크 아님 — 유지
      let slug = m[1];
      try {
        slug = decodeURIComponent(slug);
      } catch {
        /* keep raw */
      }
      return published.has(slug) ? full : inner; // 발행됨=링크, 미발행=텍스트
    }
  );
}

export async function getPublishedBlog(slug: string): Promise<BlogPostDetail | null> {
  const sb = admin();
  // url_slug 우선, 없으면 content_id 로 조회.
  let { data: blogs } = await sb
    .from('mkt_blog_contents')
    .select('id, content_id, title, seo_title, meta_description, url_slug, primary_keyword')
    .eq('channel', 'self_hosted')
    .eq('url_slug', slug)
    .limit(1);
  if (!blogs?.length) {
    ({ data: blogs } = await sb
      .from('mkt_blog_contents')
      .select('id, content_id, title, seo_title, meta_description, url_slug, primary_keyword')
      .eq('channel', 'self_hosted')
      .eq('content_id', slug)
      .limit(1));
  }
  const blog = blogs?.[0] as Record<string, unknown> | undefined;
  if (!blog) return null;
  const contentId = blog.content_id as string;

  // 발행됨(publish record) 확인 — 미발행이면 공개 안 함.
  const { data: rec } = await sb
    .from('mkt_publish_records')
    .select('published_at')
    .eq('channel', 'self_hosted')
    .eq('status', 'published')
    .eq('content_id', contentId)
    .limit(1);
  if (!rec?.length) return null;

  const [{ data: cards }, { data: content }] = await Promise.all([
    sb
      .from('mkt_blog_cards')
      .select('card_type, content, sort_order')
      .eq('blog_content_id', blog.id as string)
      .order('sort_order'),
    sb.from('mkt_contents').select('category, memo').eq('id', contentId).single(),
  ]);

  const memo = (content?.memo as string) ?? '';
  const storybookId = memo.startsWith('storybook:') ? memo.slice('storybook:'.length) : null;

  // 교차 블로그 링크 정리 — 미발행 블로그 링크는 텍스트로 강등(죽은 링크 방지).
  const published = await publishedSlugSet();
  const cleanCards = (
    (cards ?? []) as Array<{ card_type: string; content: Record<string, unknown> }>
  ).map((c) => {
    const ct = { ...(c.content ?? {}) };
    for (const k of ['html', 'text']) {
      if (typeof ct[k] === 'string') ct[k] = sanitizeCrossLinks(ct[k] as string, published);
    }
    return { type: c.card_type, content: ct };
  });

  return {
    slug: (blog.url_slug as string) || contentId,
    title: (blog.seo_title as string) || (blog.title as string) || '(제목 없음)',
    description: (blog.meta_description as string) || '',
    category: (content?.category as string) ?? null,
    publishedAt: (rec[0] as { published_at: string | null }).published_at,
    primaryKeyword: (blog.primary_keyword as string) ?? null,
    storybookId,
    cards: cleanCards,
  };
}
