// 공개 블로그 목록 — /blog. 발행된 자체 내부 블로그(동화책 SEO 글)를 카드 그리드로.
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSeo } from '@/lib/useSeo';
import { SiteFooter } from '@/components/SiteFooter';
import { useBlogPosts, type BlogPostSummary } from './api';

const CAT_META: Record<string, { label: string; emoji: string; badge: string; grad: string }> = {
  classic: {
    label: '세계명작',
    emoji: '📖',
    badge: 'bg-coral-100 text-coral-600',
    grad: 'from-coral-100 to-peach-200',
  },
  nature: {
    label: '자연관찰',
    emoji: '🌿',
    badge: 'bg-mint-100 text-mint-600',
    grad: 'from-mint-200 to-mint-50',
  },
};

// 이미 퍼센트 인코딩된 url 은 그대로(encodeURI 하면 %→%25 이중 인코딩), raw 한글은 인코딩.
function safeSrc(u: string): string {
  try {
    if (decodeURI(u) !== u) return u;
  } catch {
    return u;
  }
  return encodeURI(u);
}

function fmtDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

function Cover({ post, className }: { post: BlogPostSummary; className?: string }) {
  const cat = post.category ? CAT_META[post.category] : undefined;
  if (post.thumbnail) {
    return (
      <img
        src={safeSrc(post.thumbnail)}
        alt={post.title}
        loading="lazy"
        className={`h-full w-full object-cover ${className ?? ''}`}
      />
    );
  }
  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${cat?.grad ?? 'from-peach-200 to-cream-50'} ${className ?? ''}`}
    >
      <span className="text-5xl opacity-70">{cat?.emoji ?? '🐯'}</span>
    </div>
  );
}

function CatBadge({ category }: { category: string | null }) {
  const cat = category ? CAT_META[category] : undefined;
  if (!cat) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${cat.badge}`}
    >
      <span>{cat.emoji}</span>
      {cat.label}
    </span>
  );
}

export default function BlogListPage() {
  const { lang } = useParams();
  const pre = lang && lang !== 'ko' ? `/${lang}` : '';
  const { data: posts = [], isLoading } = useBlogPosts(lang || 'ko');
  const [filter, setFilter] = useState<'all' | 'classic' | 'nature'>('all');

  useSeo({
    title: '탱고북 블로그 — 동화·자연관찰 이야기',
    description:
      '세계명작 동화와 자연관찰 이야기를 부모와 아이가 함께 읽는 탱고북 블로그. 작품 소개, 원작 이야기, 읽어주는 법, 함께 나눌 질문까지.',
    path: `${pre}/blog`,
  });

  const counts = useMemo(() => {
    const c = { all: posts.length, classic: 0, nature: 0 };
    for (const p of posts) {
      if (p.category === 'classic') c.classic++;
      else if (p.category === 'nature') c.nature++;
    }
    return c;
  }, [posts]);

  const filtered = useMemo(
    () => (filter === 'all' ? posts : posts.filter((p) => p.category === filter)),
    [posts, filter]
  );

  const [featured, ...rest] = filtered;

  const TABS: Array<{ key: 'all' | 'classic' | 'nature'; label: string }> = [
    { key: 'all', label: `전체 ${counts.all}` },
    { key: 'classic', label: `📖 세계명작 ${counts.classic}` },
    { key: 'nature', label: `🌿 자연관찰 ${counts.nature}` },
  ];

  return (
    <div className="relative min-h-dvh overflow-hidden bg-cream-50">
      {/* 배경 분위기 — 부드러운 블롭 */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-peach-200/60 blur-3xl" />
        <div className="absolute right-[-6rem] top-40 h-64 w-64 rounded-full bg-mint-100/70 blur-3xl" />
        <div className="absolute bottom-10 left-1/3 h-56 w-56 rounded-full bg-coral-100/60 blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-dvh flex-col">
        {/* 헤더 */}
        <header className="sticky top-0 z-20 border-b border-ink-100 bg-cream-50/85 backdrop-blur-md">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
            <Link to="/library" className="font-display text-lg font-bold text-ink-900">
              🐯 탱고북
            </Link>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-ink-500 shadow-sm">
              블로그
            </span>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
          {/* Hero */}
          <div className="text-center">
            <span className="inline-block rounded-full bg-coral-100 px-3 py-1 text-xs font-bold text-coral-600">
              탱고북 이야기
            </span>
            <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight text-ink-900 break-keep sm:text-[42px]">
              동화 <span className="text-coral-500">·</span> 자연관찰 이야기
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm text-ink-500 break-keep sm:text-base">
              세계명작 동화와 자연관찰을 부모와 아이가 함께 읽어요. 작품 이야기부터 읽어주는 법,
              함께 나눌 질문까지.
            </p>
          </div>

          {/* 필터 탭 */}
          {posts.length > 0 && (
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {TABS.map((t) => {
                const active = filter === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setFilter(t.key)}
                    className={`min-h-[40px] rounded-full px-4 text-sm font-bold transition ${
                      active
                        ? 'bg-ink-900 text-white shadow-sm'
                        : 'bg-white text-ink-500 shadow-sm hover:bg-peach-50'
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* 목록 */}
          {isLoading ? (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse overflow-hidden rounded-3xl border border-ink-100 bg-white"
                >
                  <div className="aspect-[4/3] bg-ink-100/60" />
                  <div className="space-y-2 p-4">
                    <div className="h-3 w-16 rounded bg-ink-100" />
                    <div className="h-4 w-3/4 rounded bg-ink-100" />
                    <div className="h-3 w-full rounded bg-ink-100/60" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="mt-16 text-center">
              <div className="text-5xl">🌱</div>
              <p className="mt-4 text-sm text-ink-500 break-keep">
                곧 새 글이 하나씩 올라옵니다. 조금만 기다려 주세요.
              </p>
            </div>
          ) : (
            <div className="mt-10 space-y-10">
              {/* Featured — 최신 글 크게 */}
              {featured && (
                <Link
                  to={`${pre}/blog/${encodeURIComponent(featured.slug)}`}
                  className="group grid overflow-hidden rounded-[2rem] border border-ink-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl md:grid-cols-2"
                >
                  <div className="relative aspect-[16/10] overflow-hidden md:aspect-auto md:h-full">
                    <Cover
                      post={featured}
                      className="transition duration-500 group-hover:scale-[1.04]"
                    />
                    <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold text-coral-600 shadow-sm">
                      최신 글
                    </span>
                  </div>
                  <div className="flex flex-col justify-center gap-3 p-6 sm:p-8">
                    <div className="flex items-center gap-2">
                      <CatBadge category={featured.category} />
                      <span className="text-xs text-ink-400">{fmtDate(featured.publishedAt)}</span>
                    </div>
                    <h2 className="font-display text-2xl font-extrabold leading-snug text-ink-900 break-keep sm:text-[26px]">
                      {featured.title}
                    </h2>
                    {featured.description && (
                      <p className="line-clamp-3 text-sm leading-relaxed text-ink-600 break-keep">
                        {featured.description}
                      </p>
                    )}
                    <span className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-coral-500">
                      이야기 읽기
                      <span className="transition group-hover:translate-x-0.5">→</span>
                    </span>
                  </div>
                </Link>
              )}

              {/* 나머지 카드 그리드 */}
              {rest.length > 0 && (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map((p) => (
                    <Link
                      key={p.slug}
                      to={`${pre}/blog/${encodeURIComponent(p.slug)}`}
                      className="group flex flex-col overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <Cover
                          post={p}
                          className="transition duration-500 group-hover:scale-[1.05]"
                        />
                      </div>
                      <div className="flex flex-1 flex-col gap-2 p-4">
                        <div className="flex items-center gap-2">
                          <CatBadge category={p.category} />
                          <span className="text-[11px] text-ink-400">{fmtDate(p.publishedAt)}</span>
                        </div>
                        <h3 className="font-display text-base font-bold leading-snug text-ink-900 break-keep">
                          {p.title}
                        </h3>
                        {p.description && (
                          <p className="line-clamp-2 text-[13px] leading-relaxed text-ink-500 break-keep">
                            {p.description}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>

        <SiteFooter />
      </div>
    </div>
  );
}
