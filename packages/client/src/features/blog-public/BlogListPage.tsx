// 공개 블로그 목록 — /blog. 발행된 자체 내부 블로그(동화책 SEO 글) 리스트.
import { Link } from 'react-router-dom';
import { useSeo } from '@/lib/useSeo';
import { SiteFooter } from '@/components/SiteFooter';
import { useBlogPosts } from './api';

const CAT_LABEL: Record<string, { label: string; cls: string }> = {
  classic: { label: '세계명작', cls: 'bg-coral/10 text-coral' },
  nature: { label: '자연관찰', cls: 'bg-emerald-500/10 text-emerald-600' },
};

function fmtDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function BlogListPage() {
  const { data: posts = [], isLoading } = useBlogPosts();

  useSeo({
    title: '탱고북 블로그 — 동화·자연관찰 이야기',
    description:
      '세계명작 동화와 자연관찰 이야기를 부모와 아이가 함께 읽는 탱고북 블로그. 작품 소개, 원작 이야기, 읽어주는 법, 함께 나눌 질문까지.',
    path: '/blog',
  });

  return (
    <div className="min-h-dvh bg-cream flex flex-col">
      {/* 헤더 */}
      <header className="border-b border-ink/10 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/library" className="text-lg font-display font-bold text-ink">
            🐯 탱고북
          </Link>
          <span className="text-sm font-semibold text-ink/60">블로그</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="font-display text-2xl font-bold text-ink break-keep sm:text-3xl">
          동화·자연관찰 이야기
        </h1>
        <p className="mt-2 text-sm text-ink/60 break-keep">
          세계명작 동화와 자연관찰을 부모와 아이가 함께 읽어요.
        </p>

        {isLoading ? (
          <p className="py-16 text-center text-sm text-ink/40">불러오는 중…</p>
        ) : posts.length === 0 ? (
          <p className="py-16 text-center text-sm text-ink/40 break-keep">
            곧 새 글이 하나씩 올라옵니다. 조금만 기다려 주세요 🌱
          </p>
        ) : (
          <ul className="mt-6 space-y-3">
            {posts.map((p) => {
              const cat = p.category ? CAT_LABEL[p.category] : undefined;
              return (
                <li key={p.slug}>
                  <Link
                    to={`/blog/${encodeURIComponent(p.slug)}`}
                    className="block rounded-2xl border border-ink/10 bg-white p-4 transition hover:border-coral/40 hover:shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      {cat && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${cat.cls}`}
                        >
                          {cat.label}
                        </span>
                      )}
                      <span className="text-xs text-ink/40">{fmtDate(p.publishedAt)}</span>
                    </div>
                    <h2 className="mt-1.5 font-display text-base font-bold text-ink break-keep">
                      {p.title}
                    </h2>
                    {p.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-ink/60 break-keep">
                        {p.description}
                      </p>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
