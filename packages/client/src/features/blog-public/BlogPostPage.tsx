// 공개 블로그 글 — /blog/:slug. 발행된 자체 내부 블로그 1건 렌더 + 동화책 CTA.
import { Link, useParams } from 'react-router-dom';
import { useSeo } from '@/lib/useSeo';
import { SiteFooter } from '@/components/SiteFooter';
import { useBlogPost } from './api';
import { BlogCards } from './BlogCards';

const CAT_LABEL: Record<string, string> = { classic: '세계명작', nature: '자연관찰' };

function fmtDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

// 저작 HTML(h2/h3/p/a…) 가독 스타일. 공개 블로그 전용.
const PROSE_CSS = `
.blog-prose{color:#3f2f24}
.blog-prose h2{font-size:1.25rem;font-weight:800;margin:1.8rem 0 .6rem;word-break:keep-all;line-height:1.4;color:#251c15}
.blog-prose h3{font-size:1.08rem;font-weight:700;margin:1.2rem 0 .4rem;word-break:keep-all;color:#251c15}
.blog-prose p{margin:.7rem 0;line-height:1.85;word-break:keep-all;color:#3f2f24}
.blog-prose ul,.blog-prose ol{margin:.7rem 0;padding-left:1.4rem;line-height:1.8;color:#3f2f24}
.blog-prose li{margin:.25rem 0;word-break:keep-all}
.blog-prose a{color:#ff5e3a;font-weight:600;text-decoration:underline;text-underline-offset:2px}
.blog-prose img{border-radius:1rem;margin:.5rem 0}
.blog-prose strong{font-weight:700;color:#251c15}
`;

export default function BlogPostPage() {
  const { slug = '' } = useParams();
  const { data: post, isLoading, isError } = useBlogPost(slug);

  useSeo({
    title: post ? `${post.title} — 탱고북 블로그` : '탱고북 블로그',
    description: post?.description || undefined,
    path: `/blog/${slug}`,
    type: 'article',
  });

  return (
    <div className="flex min-h-dvh flex-col bg-cream-50">
      <style>{PROSE_CSS}</style>
      <header className="sticky top-0 z-20 border-b border-ink-100 bg-cream-50/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/library" className="font-display text-lg font-bold text-ink-900">
            🐯 탱고북
          </Link>
          <Link to="/blog" className="text-sm font-semibold text-ink-500 hover:text-coral-500">
            블로그
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        {isLoading ? (
          <p className="py-16 text-center text-sm text-ink-400">불러오는 중…</p>
        ) : isError || !post ? (
          <div className="py-16 text-center">
            <p className="text-sm text-ink-500 break-keep">글을 찾을 수 없어요.</p>
            <Link to="/blog" className="mt-3 inline-block text-sm text-coral-500 hover:underline">
              ← 블로그 목록으로
            </Link>
          </div>
        ) : (
          <article>
            <Link to="/blog" className="text-sm text-ink-400 hover:text-coral-500">
              ← 목록
            </Link>
            <div className="mt-3 flex items-center gap-2">
              {post.category && CAT_LABEL[post.category] && (
                <span className="rounded-full bg-coral-100 px-2 py-0.5 text-[11px] font-bold text-coral-600">
                  {CAT_LABEL[post.category]}
                </span>
              )}
              <span className="text-xs text-ink-400">{fmtDate(post.publishedAt)}</span>
            </div>
            <h1 className="mt-2 font-display text-2xl font-bold text-ink-900 break-keep sm:text-[28px]">
              {post.title}
            </h1>

            <div className="mt-6">
              <BlogCards cards={post.cards} />
            </div>

            {post.storybookId && (
              <div className="mt-10 rounded-2xl border border-coral-200 bg-coral-100/40 p-5 text-center">
                <p className="text-sm font-bold text-ink-900 break-keep">
                  이 이야기를 그림책으로 만나보세요 📖
                </p>
                <Link
                  to={`/library/${post.storybookId}`}
                  className="mt-3 inline-block rounded-full bg-coral-500 px-5 py-2 text-sm font-bold text-white transition hover:bg-coral-600"
                >
                  동화책 보러가기
                </Link>
              </div>
            )}
          </article>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
