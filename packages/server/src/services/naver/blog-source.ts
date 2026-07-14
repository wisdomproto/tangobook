/**
 * 발행 소스: 마케팅 시스템(Supabase mkt_blog_contents/cards)에서 블로그 글을 조립.
 * Supabase I/O 격리 계층 — 순수 변환은 blog-html.ts(buildInjectionPlan)가 담당.
 * (최초 설계의 R2 books blog 는 실측 결과 미완비 → 소스를 이쪽으로 변경. 스펙 §소스변경 참조.)
 */
import { getSupabaseAdmin } from '../../providers/supabase-admin.provider.js';
import type { BlogSource, BlogSourceCard } from './blog-html.js';

const CONTENTS = 'mkt_blog_contents';
const CARDS = 'mkt_blog_cards';

/** 발행 대상 경량 목록 항목(카드 미포함). 실제 본문은 loadBlogSource 로 지연 로드. */
export interface BlogTarget {
  blogContentId: string; // mkt_blog_contents.id
  bookId: string; // mkt_blog_contents.content_id
  title: string;
  status: string;
}

function requireAdmin() {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error('Supabase 서비스 키 미설정 — 마케팅 블로그 로드 불가');
  return sb;
}

/** mkt_blog_cards.content jsonb 의 실제 형태(부분). */
interface CardContent {
  text?: string;
  url?: string;
  caption?: string;
}

/**
 * 발행 대상 목록. created_at 오름차순(오래된 글부터).
 * @param opts.blogId  특정 블로그 글만
 * @param opts.status  상태 필터(기본 'draft' — 아직 발행 안 한 글)
 * @param opts.limit   상한
 */
export async function listBlogTargets(
  opts: { blogId?: string; status?: string; limit?: number } = {}
): Promise<BlogTarget[]> {
  const sb = requireAdmin();
  let q = sb
    .from(CONTENTS)
    .select('id, content_id, title, status')
    .order('created_at', { ascending: true });
  if (opts.blogId) q = q.eq('id', opts.blogId);
  if (opts.status) q = q.eq('status', opts.status);
  if (opts.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    blogContentId: r.id as string,
    bookId: r.content_id as string,
    title: r.title as string,
    status: r.status as string,
  }));
}

/** 블로그 글 1개를 카드까지 조립해 BlogSource 로 반환. 없으면 null. */
export async function loadBlogSource(blogContentId: string): Promise<BlogSource | null> {
  const sb = requireAdmin();
  const { data: bc, error: e1 } = await sb
    .from(CONTENTS)
    .select('id, content_id, title, primary_keyword, secondary_keywords')
    .eq('id', blogContentId)
    .maybeSingle();
  if (e1) throw new Error(e1.message);
  if (!bc) return null;

  const { data: cards, error: e2 } = await sb
    .from(CARDS)
    .select('id, content, sort_order')
    .eq('blog_content_id', blogContentId)
    .order('sort_order', { ascending: true });
  if (e2) throw new Error(e2.message);

  const tags = dedupe(
    [
      bc.primary_keyword as string | null,
      ...((bc.secondary_keywords as string[] | null) ?? []),
    ].filter((t): t is string => !!t && t.trim().length > 0)
  );

  const sourceCards: BlogSourceCard[] = (cards ?? []).map((c) => {
    const content = (c.content ?? {}) as CardContent;
    const url = content.url?.trim();
    return {
      id: c.id as string,
      html: content.text ?? '',
      imageUrl: url ? url : undefined,
      caption: content.caption?.trim() || undefined,
    };
  });

  return {
    blogContentId: bc.id as string,
    bookId: bc.content_id as string,
    title: bc.title as string,
    tags,
    cards: sourceCards,
  };
}

function dedupe(arr: string[]): string[] {
  return [...new Set(arr)];
}
