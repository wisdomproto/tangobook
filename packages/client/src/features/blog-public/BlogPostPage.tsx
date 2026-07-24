// 공개 블로그 글 — /blog/:slug. 발행된 자체 내부 블로그 1건 렌더 + 동화책 CTA.
import { Link, useParams } from 'react-router-dom';
import { useSeo } from '@/lib/useSeo';
import { SiteFooter } from '@/components/SiteFooter';
import { useBlogPost } from './api';
import { BlogCards } from './BlogCards';
import { useBlogLang } from './useBlogLang';

const CAT_META: Record<string, { tKey: string; emoji: string; badge: string }> = {
  classic: { tKey: 'catClassic', emoji: '📖', badge: 'bg-coral-100 text-coral-600' },
  nature: { tKey: 'catNature', emoji: '🌿', badge: 'bg-mint-100 text-mint-600' },
};

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
  const { lang, pre, t, brand, fmtDate } = useBlogLang();
  const { data: post, isLoading, isError } = useBlogPost(slug, lang);

  useSeo({
    title: post ? `${post.title} — ${t('seoPostSuffix')}` : t('seoPostSuffix'),
    description: post?.description || undefined,
    path: `${pre}/blog/${slug}`,
    type: 'article',
  });

  const cat = post?.category ? CAT_META[post.category] : undefined;

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-cream-50">
      <style>{PROSE_CSS}</style>
      {/* 배경 분위기 */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-peach-200/50 blur-3xl" />
        <div className="absolute right-[-6rem] top-60 h-64 w-64 rounded-full bg-mint-100/60 blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-dvh flex-col">
        <header className="sticky top-0 z-20 border-b border-ink-100 bg-cream-50/85 backdrop-blur-md">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
            <Link to="/library" className="font-display text-lg font-bold text-ink-900">
              🐯 {brand}
            </Link>
            <Link
              to={`${pre}/blog`}
              className="text-sm font-semibold text-ink-500 hover:text-coral-500"
            >
              {t('nav')}
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
          {isLoading ? (
            <p className="py-16 text-center text-sm text-ink-400">{t('loading')}</p>
          ) : isError || !post ? (
            <div className="py-16 text-center">
              <p className="text-sm text-ink-500 break-keep">{t('notFound')}</p>
              <Link
                to={`${pre}/blog`}
                className="mt-3 inline-block text-sm text-coral-500 hover:underline"
              >
                {t('backToList')}
              </Link>
            </div>
          ) : (
            <>
              <Link
                to={`${pre}/blog`}
                className="inline-flex items-center gap-1 text-sm font-semibold text-ink-400 transition hover:text-coral-500"
              >
                {t('back')}
              </Link>

              {/* 본문 카드 — 읽기 서피스 */}
              <article className="mt-4 overflow-hidden rounded-[2rem] border border-ink-100 bg-white shadow-sm">
                <div className="px-6 pt-8 sm:px-10 sm:pt-10">
                  <div className="flex items-center gap-2">
                    {cat && (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${cat.badge}`}
                      >
                        <span>{cat.emoji}</span>
                        {t(cat.tKey)}
                      </span>
                    )}
                    <span className="text-xs text-ink-400">{fmtDate(post.publishedAt)}</span>
                  </div>
                  <h1 className="mt-3 font-display text-[26px] font-extrabold leading-snug text-ink-900 break-keep sm:text-[32px]">
                    {post.title}
                  </h1>
                  {post.description && (
                    <p className="mt-3 text-sm leading-relaxed text-ink-500 break-keep sm:text-base">
                      {post.description}
                    </p>
                  )}
                  <div className="mt-6 h-px w-full bg-ink-100" />
                </div>

                <div className="px-6 pb-9 pt-6 sm:px-10 sm:pb-11">
                  <BlogCards cards={post.cards} />
                </div>
              </article>

              {/* 동화책 CTA */}
              {post.storybookId && (
                <div className="mt-6 flex flex-col items-center gap-3 rounded-[2rem] border border-coral-200 bg-gradient-to-br from-coral-100 to-peach-200 p-7 text-center">
                  <p className="text-base font-bold text-ink-900 break-keep">{t('ctaTitle')}</p>
                  <p className="text-xs text-ink-600 break-keep">{t('ctaDesc')}</p>
                  <Link
                    to={
                      lang === 'ko'
                        ? `/library/${post.storybookId}`
                        : `/${lang}?to=${encodeURIComponent(`/library/${post.storybookId}`)}`
                    }
                    className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-coral-500 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-coral-600"
                  >
                    {t('ctaButton')}
                  </Link>
                </div>
              )}

              {/* 하단 목록 링크 */}
              <div className="mt-8 text-center">
                <Link
                  to={`${pre}/blog`}
                  className="inline-block rounded-full bg-white px-5 py-2 text-sm font-bold text-ink-600 shadow-sm transition hover:bg-peach-50"
                >
                  {t('moreStories')}
                </Link>
              </div>
            </>
          )}
        </main>

        <SiteFooter minimal lang={lang} />
      </div>
    </div>
  );
}
