// 카테고리 허브 페이지 (/guide/classics · /guide/nature) — SEO 랜딩.
// 152개 블로그가 secondary 로 나눠 갖던 카테고리 키워드("유아 명작 동화" 등)를 모으는
// 허브. 서버 SSR(seo-ssr.service.ts renderHubSeo)과 동일한 콘텐츠를 React 로 렌더.
import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useStorybooks } from '@/features/storybook';
import { Skeleton, StateScreen } from '@/design-system';
import { useSeo } from '@/lib/useSeo';
import type { StorybookSummary } from '@tangobook/shared';

const HUBS = {
  classics: {
    title: '세계 명작 동화 전집 — 4~7세 명작 그림책 | 탱고북',
    h1: '세계 명작 동화 전집 (4~7세 그림책)',
    intro:
      '신데렐라·백설공주·인어공주부터 어린 왕자·오즈의 마법사까지 — 유아 명작 동화를 아이 눈높이 그림책으로 다시 만들었어요. 한글·영어 나레이션과 단어 학습, 부모님 가이드가 함께 있는 세계명작동화 전집입니다. 각 책의 줄거리·교훈·읽어주기 팁을 확인해 보세요.',
    isClassics: true,
  },
  nature: {
    title: '자연관찰 그림책 — 동물·곤충·공룡·식물 | 탱고북',
    h1: '자연관찰 그림책 (동물·곤충·공룡·식물)',
    intro:
      '공룡 친구들부터 곤충, 바다·육지·하늘 동물, 식물과 우주까지 — 4~7세 유아 자연관찰 책을 실사 대신 따뜻한 그림책으로 만들었어요. 동물 그림책·공룡 그림책을 찾고 있다면 아이와 함께 한 권씩 관찰해 보세요. 책마다 핵심 단어 학습과 부모님 가이드가 들어 있어요.',
    isClassics: false,
  },
} as const;

const VARIANT_RE = /__L\d+$/;

export default function GuideHubPage() {
  const { hub: hubSlug = '' } = useParams();
  const hub = HUBS[hubSlug as keyof typeof HUBS];
  const { data: books, isLoading } = useStorybooks();

  useSeo({
    title: hub?.title,
    description: hub?.intro,
    path: `/guide/${hubSlug}`,
  });

  const grouped = useMemo(() => {
    if (!hub || !books) return [];
    const list = books.filter(
      (b) =>
        !VARIANT_RE.test(b.id) &&
        (b.type ?? 'storybook') === 'storybook' &&
        b.isPublic !== false &&
        (hub.isClassics ? b.category === '세계 명작' : b.category !== '세계 명작')
    );
    const byCat = new Map<string, StorybookSummary[]>();
    for (const b of list) {
      const cat = b.category || '기타';
      if (!byCat.has(cat)) byCat.set(cat, []);
      byCat.get(cat)!.push(b);
    }
    return [...byCat.entries()];
  }, [hub, books]);

  if (!hub) return <StateScreen mascotState="thinking" title="페이지를 찾을 수 없어요" />;
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const total = grouped.reduce((n, [, items]) => n + items.length, 0);

  return (
    <article className="bg-gradient-to-b from-peach-50 to-white min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <nav className="text-xs text-slate-500 mb-4" aria-label="Breadcrumb">
          <Link to="/library" className="hover:text-coral-600">
            라이브러리
          </Link>
          <span className="mx-1">›</span>
          <span className="text-slate-700 font-bold">{hub.h1}</span>
        </nav>

        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight break-keep">
            {hub.h1}
          </h1>
          <p className="mt-3 text-base text-slate-600 leading-relaxed break-keep">{hub.intro}</p>
          <p className="mt-2 text-sm font-bold text-coral-600">총 {total}권</p>
        </header>

        {grouped.map(([cat, items]) => (
          <section key={cat} className="mb-10">
            <h2 className="text-xl font-black text-slate-900 mb-3 border-l-4 border-coral-500 pl-3">
              {cat} ({items.length}권)
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {items.map((b) => (
                <Link
                  key={b.id}
                  to={`/library/${b.id}/about`}
                  className="block rounded-xl border border-slate-200 bg-white overflow-hidden hover:shadow-pop transition"
                >
                  <div className="aspect-video bg-slate-100">
                    {b.coverImage && (
                      <img
                        src={b.coverImage}
                        alt={`${b.title} 표지`}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="p-2 text-sm font-bold text-slate-800 line-clamp-2">{b.title}</div>
                </Link>
              ))}
            </div>
          </section>
        ))}

        <div className="mt-12 text-center">
          <Link
            to="/library"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-coral-500 text-white font-black text-lg hover:bg-coral-600 shadow-pop"
          >
            ⭐ 탱고북 라이브러리에서 바로 읽기
          </Link>
          <div className="mt-3 text-xs text-slate-500">
            <Link to="/blog" className="underline hover:text-coral-600">
              블로그 가이드 보기
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
