import { useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useStorybook, useStorybooks } from '@/features/storybook';
import { Skeleton, StateScreen } from '@/design-system';
import { SUPPORTED_LANGUAGES, seoStrings, fill, HUB_STRINGS } from '@tangobook/shared';
import type { Storybook, StorybookSummary, ReadingLevel } from '@tangobook/shared';

const LANG_CODES: string[] = SUPPORTED_LANGUAGES.map((l) => l.code);

/** ko = bare 경로, 그 외 = /lang 프리픽스 (서버 seo-ssr.service langPrefix 와 동일 규칙) */
function langPrefix(lang: string): string {
  return lang === 'ko' ? '' : `/${lang}`;
}

/** 해당 언어의 about 페이지 존재 여부 — 서버 hasAboutLang 미러 */
function hasAboutLang(sb: Storybook, lang: string): boolean {
  if (lang === 'ko') return true;
  if (!LANG_CODES.includes(lang)) return false;
  return Boolean(sb.titleTranslations?.[lang] && sb.parentGuideTranslations?.[lang]);
}

const LEVEL_INFO: Record<ReadingLevel, { label: string; age: string }> = {
  L1: { label: '씨앗', age: '3~4세' },
  L2: { label: '새싹', age: '4~6세' },
  L3: { label: '나무', age: '6~7세' },
};

// 🔴 canonical/og:url/JSON-LD 는 항상 정식 www 호스트 — window.origin 을 쓰면
// prerender(localhost)·비-www 접속에서 오염된 canonical 이 크롤러에 노출된다.
const SITE_URL = 'https://www.tangobook.co.kr';

function setMetaTag(name: string, content: string, attr: 'name' | 'property' = 'name') {
  if (typeof document === 'undefined') return;
  let tag = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function setCanonical(href: string) {
  if (typeof document === 'undefined') return;
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

/** hreflang alternate 링크 주입 — 기존(SSR 주입 포함) hreflang 링크는 교체 */
function setHreflangs(entries: Array<{ hreflang: string; href: string }>) {
  if (typeof document === 'undefined') return;
  document.querySelectorAll('link[rel="alternate"][hreflang]').forEach((el) => el.remove());
  entries.forEach(({ hreflang, href }) => {
    const link = document.createElement('link');
    link.setAttribute('rel', 'alternate');
    link.setAttribute('hreflang', hreflang);
    link.setAttribute('href', href);
    document.head.appendChild(link);
  });
}

function setJsonLd(id: string, data: object | object[]) {
  if (typeof document === 'undefined') return;
  let script = document.querySelector(`script[data-jsonld="${id}"]`) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-jsonld', id);
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

function summarize(text: string, max = 158): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1).replace(/[,;:\s]\S*$/, '') + '…';
}

function pickKoreanWord(ko: { korean?: string; name?: string; nameEn?: string }): {
  ko: string;
  en: string;
} {
  const k = (ko.korean || '').trim();
  const n = (ko.name || '').trim();
  const en = (ko.nameEn || '').trim();
  const HANGUL = /[가-힣]/;
  if (k && HANGUL.test(k)) return { ko: k, en: en || (HANGUL.test(n) ? '' : n) };
  if (HANGUL.test(n)) return { ko: n, en: en };
  return { ko: '', en: n };
}

export default function BookSeoPage() {
  const { id = '', lang: langParam } = useParams();
  const lang = langParam && LANG_CODES.includes(langParam) ? langParam : 'ko';
  const isKo = lang === 'ko';
  const { data: storybook, isLoading, isError } = useStorybook(id);
  const { data: storybookList } = useStorybooks();

  const sameCategoryBooks = useMemo<StorybookSummary[]>(() => {
    if (!storybook || !storybookList) return [];
    return storybookList
      .filter(
        (b) =>
          b.id !== storybook.id &&
          b.category === storybook.category &&
          (b.type ?? 'storybook') === 'storybook' &&
          // variant 같은 base 는 제외
          b.id.replace(/__L\d+$/, '') !== storybook.id.replace(/__L\d+$/, '')
      )
      .slice(0, 6);
  }, [storybook, storybookList]);

  // SEO meta + JSON-LD
  useEffect(() => {
    if (!storybook) return;
    // 서버 SSR(seo-ssr.service.ts renderAboutSeo)과 동일 포맷 유지 — "동화책" 인접 배치 + 줄거리·교훈 롱테일
    const S = seoStrings(lang);
    const displayTitle = isKo
      ? storybook.title
      : (storybook.titleTranslations?.[lang] ?? storybook.title);
    const guide = isKo
      ? storybook.parentGuide
      : (storybook.parentGuideTranslations?.[lang] ?? storybook.parentGuide);
    const title = fill(S.aboutTitle, displayTitle);
    const overview =
      guide?.overview || (isKo ? '아이와 함께 읽는 동화책' : `${displayTitle} — Tangobook`);
    const description = summarize(overview);
    const coverImage = storybook.coverImage || (storybook.coverImages?.[0]?.imageUrl ?? '');
    const canonical = `${SITE_URL}${langPrefix(lang)}/library/${storybook.id}/about`;

    document.title = title;
    setMetaTag('description', description);
    setMetaTag('og:title', title, 'property');
    setMetaTag('og:description', description, 'property');
    setMetaTag('og:type', 'article', 'property');
    setMetaTag('og:url', canonical, 'property');
    if (coverImage) setMetaTag('og:image', coverImage, 'property');
    setMetaTag('twitter:card', coverImage ? 'summary_large_image' : 'summary');
    setMetaTag('twitter:title', title);
    setMetaTag('twitter:description', description);
    if (coverImage) setMetaTag('twitter:image', coverImage);
    setCanonical(canonical);

    // hreflang alternate — 번역(제목+가이드)이 존재하는 언어들만 상호 링크 (서버 hasAboutLang 미러)
    const altLangs = LANG_CODES.filter((l) => hasAboutLang(storybook, l));
    if (altLangs.length > 1) {
      setHreflangs([
        ...altLangs.map((l) => ({
          hreflang: l,
          href: `${SITE_URL}${langPrefix(l)}/library/${storybook.id}/about`,
        })),
        { hreflang: 'x-default', href: `${SITE_URL}/library/${storybook.id}/about` },
      ]);
    } else {
      setHreflangs([]);
    }

    // JSON-LD: Book
    const bookSchema = {
      '@context': 'https://schema.org',
      '@type': 'Book',
      name: displayTitle,
      description: overview,
      url: canonical,
      image: coverImage || undefined,
      inLanguage: storybook.languages?.length ? storybook.languages : ['ko'],
      numberOfPages: storybook.pages?.length,
      // SEO 유료화(paywall) — 본문 전체 접근성을 정식 표기 (cloaking 회피).
      // about 페이지 마케팅 콘텐츠는 항상 공개라 무관 — 이 값은 "본문 읽기"의 무료/유료만 나타냄.
      // 미지정 = 무료(true). 유료화 시 유료 책 storybook.isAccessibleForFree=false.
      isAccessibleForFree: storybook.isAccessibleForFree ?? true,
      publisher: { '@type': 'Organization', name: '탱고북', url: SITE_URL },
      audience: {
        '@type': 'PeopleAudience',
        suggestedMinAge:
          storybook.readingLevel === 'L1' ? 3 : storybook.readingLevel === 'L2' ? 4 : 6,
        suggestedMaxAge:
          storybook.readingLevel === 'L1' ? 4 : storybook.readingLevel === 'L2' ? 6 : 7,
      },
    };

    // JSON-LD: FAQPage
    const faqs = guide?.faq ?? [];
    const faqSchema = faqs.length
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        }
      : null;

    // JSON-LD: BreadcrumbList
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: S.libraryBreadcrumb,
          item: `${SITE_URL}/library`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: storybook.category || S.h1Suffix,
          item: `${SITE_URL}/library?category=${encodeURIComponent(storybook.category || '')}`,
        },
        { '@type': 'ListItem', position: 3, name: displayTitle, item: canonical },
      ],
    };

    // JSON-LD: LearningResource
    const keyObjectsKo = (storybook.key_objects ?? [])
      .map((k) =>
        isKo ? pickKoreanWord(k).ko : (k.nameTranslations?.[lang] ?? pickKoreanWord(k).ko)
      )
      .filter(Boolean);
    const learningSchema = {
      '@context': 'https://schema.org',
      '@type': 'LearningResource',
      name: displayTitle,
      description: overview,
      url: canonical,
      educationalLevel: storybook.readingLevel ? LEVEL_INFO[storybook.readingLevel].label : '유아',
      educationalUse: '어휘 학습, 정서 발달, 함께 읽기',
      inLanguage: storybook.languages?.length ? storybook.languages : ['ko'],
      teaches: keyObjectsKo.slice(0, 20),
      provider: { '@type': 'Organization', name: '탱고북', url: SITE_URL },
    };

    setJsonLd('book', bookSchema);
    if (faqSchema) setJsonLd('faq', faqSchema);
    else {
      const old = document.querySelector('script[data-jsonld="faq"]');
      if (old) old.remove();
    }
    setJsonLd('breadcrumb', breadcrumbSchema);
    setJsonLd('learning', learningSchema);

    return () => {
      // 페이지 떠날 때 JSON-LD·hreflang 정리 (다른 페이지에 잔존 방지)
      ['book', 'faq', 'breadcrumb', 'learning'].forEach((k) => {
        const s = document.querySelector(`script[data-jsonld="${k}"]`);
        if (s) s.remove();
      });
      setHreflangs([]);
    };
  }, [storybook, lang, isKo]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        <Skeleton className="h-64" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }
  if (isError || !storybook) {
    return <StateScreen mascotState="thinking" title="책을 찾을 수 없어요" />;
  }

  return <BookSeoContent storybook={storybook} sameCategoryBooks={sameCategoryBooks} lang={lang} />;
}

function BookSeoContent({
  storybook,
  sameCategoryBooks,
  lang,
}: {
  storybook: Storybook;
  sameCategoryBooks: StorybookSummary[];
  lang: string;
}) {
  const isKo = lang === 'ko';
  const S = seoStrings(lang);
  const displayTitle = isKo
    ? storybook.title
    : (storybook.titleTranslations?.[lang] ?? storybook.title);
  const guide = isKo
    ? storybook.parentGuide
    : (storybook.parentGuideTranslations?.[lang] ?? storybook.parentGuide);
  const overview = guide?.overview;
  const lessons = guide?.lessons ?? [];
  const tips = guide?.readingTips ?? [];
  const faqs = guide?.faq ?? [];
  const cover =
    storybook.coverImage || storybook.coverImages?.[0]?.imageUrl || '/images/placeholder-book.png';
  const pageCount = storybook.pages?.length ?? 0;
  const levelInfo = storybook.readingLevel ? LEVEL_INFO[storybook.readingLevel] : null;
  const langs = storybook.languages?.length ? storybook.languages : ['ko'];

  const keyObjects = (storybook.key_objects ?? [])
    .map((k) => {
      const { ko, en } = pickKoreanWord(k);
      if (isKo) return { ko, en, definition: k.definition, example: k.example };
      // non-ko: 번역 단어만, definition/example 은 ko 전용이라 숨김
      return {
        ko: k.nameTranslations?.[lang] ?? ko,
        en: '',
        definition: undefined,
        example: undefined,
      };
    })
    .filter((k) => k.ko);

  const isClassics = storybook.category === '세계 명작';
  // 허브 링크 — 해당 언어 허브 카피(HUB_STRINGS)가 있으면 언어 경로로 (서버와 동일)
  const hubPrefix = isKo || HUB_STRINGS[lang] ? langPrefix(lang) : '';
  const hubHref = `${hubPrefix}${isClassics ? '/guide/classics' : '/guide/nature'}`;

  return (
    <article className="bg-gradient-to-b from-peach-50 to-white min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <nav className="text-xs text-slate-500 mb-4" aria-label="Breadcrumb">
          <Link to="/library" className="hover:text-coral-600">
            {S.libraryBreadcrumb}
          </Link>
          {storybook.category && (
            <>
              <span className="mx-1">›</span>
              <span>{storybook.category}</span>
            </>
          )}
          <span className="mx-1">›</span>
          <span className="text-slate-700 font-bold">{displayTitle}</span>
        </nav>

        {/* Hero */}
        <header className="grid md:grid-cols-[280px_1fr] gap-6 mb-10">
          <div className="aspect-square rounded-3xl overflow-hidden shadow-pop bg-white">
            <img
              src={cover}
              alt={isKo ? `${displayTitle} 표지` : displayTitle}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">
                {displayTitle}
              </h1>
              {overview && (
                <p className="mt-3 text-base text-slate-600 leading-relaxed">
                  {summarize(overview, 200)}
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                {storybook.category && (
                  <span className="px-3 py-1 rounded-full bg-coral-100 text-coral-800 font-bold">
                    {storybook.category}
                  </span>
                )}
                {levelInfo && (
                  <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-bold">
                    🌱{' '}
                    {isKo
                      ? `${levelInfo.label} · ${levelInfo.age}`
                      : `${S.ageLabel} · ${levelInfo.age}`}
                  </span>
                )}
                {pageCount > 0 && (
                  <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-bold">
                    📄 {isKo ? `${pageCount}쪽` : `${pageCount} ${S.pagesLabel}`}
                  </span>
                )}
                {isKo && keyObjects.length > 0 && (
                  <span className="px-3 py-1 rounded-full bg-violet-100 text-violet-800 font-bold">
                    📚 핵심단어 {keyObjects.length}개
                  </span>
                )}
                {langs.length > 0 && (
                  <span className="px-3 py-1 rounded-full bg-sky-100 text-sky-800 font-bold">
                    🌐 {langs.join(' · ')}
                  </span>
                )}
              </div>
            </div>
            <Link
              to={`/library/${storybook.id}`}
              className="mt-6 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-coral-500 text-white font-black text-base hover:bg-coral-600 shadow-pop w-full md:w-auto"
            >
              ⭐ {isKo ? '지금 우리 아이와 함께 읽기' : fill(S.readNow, displayTitle)}
            </Link>
          </div>
        </header>

        {/* Overview — non-ko 는 섹션 제목 문자열이 없어 문단만 (서버 body 와 동일) */}
        {overview &&
          (isKo ? (
            <Section title="이 책은 어떤 책인가요?">
              <p className="text-slate-700 leading-relaxed whitespace-pre-line">{overview}</p>
            </Section>
          ) : (
            <section className="mb-10">
              <p className="text-slate-700 leading-relaxed whitespace-pre-line">{overview}</p>
            </section>
          ))}

        {/* Lessons */}
        {lessons.length > 0 && (
          <Section title={isKo ? '무엇을 배울 수 있나요?' : fill(S.lessonsHeading, displayTitle)}>
            <ul className="space-y-2">
              {lessons.map((l, i) => (
                <li key={i} className="flex gap-2 text-slate-700">
                  <span className="text-coral-500 font-black">{i + 1}.</span>
                  <span>{l}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Key Objects (어휘 long-tail SEO) */}
        {keyObjects.length > 0 && (
          <Section title={isKo ? '이 책에서 배우는 핵심 단어' : fill(S.wordsHeading, displayTitle)}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {keyObjects.map((k, i) => (
                <div key={i} className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="font-bold text-slate-900">{k.ko}</div>
                  {k.en && <div className="text-xs text-slate-500 mt-0.5">{k.en}</div>}
                  {k.definition && (
                    <div className="text-xs text-slate-600 mt-1.5 leading-snug">{k.definition}</div>
                  )}
                  {k.example && (
                    <div className="text-[11px] text-slate-400 mt-1 italic">예: {k.example}</div>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* FAQ */}
        {faqs.length > 0 && (
          <Section title={isKo ? '자주 묻는 질문' : S.faqHeading}>
            <div className="space-y-3">
              {faqs.map((f, i) => (
                <details key={i} className="rounded-xl border border-slate-200 bg-white p-4 group">
                  <summary className="font-bold text-slate-900 cursor-pointer list-none flex gap-2">
                    <span className="text-coral-500">Q.</span>
                    <span className="flex-1">{f.q}</span>
                    <span className="text-slate-400 group-open:rotate-180 transition">▾</span>
                  </summary>
                  <div className="mt-2 pl-5 text-slate-700 leading-relaxed whitespace-pre-line">
                    {f.a}
                  </div>
                </details>
              ))}
            </div>
          </Section>
        )}

        {/* Reading Tips */}
        {tips.length > 0 && (
          <Section title={isKo ? '부모님을 위한 읽어주기 팁' : fill(S.tipsHeading, displayTitle)}>
            <ul className="space-y-2">
              {tips.map((t, i) => (
                <li key={i} className="flex gap-2 text-slate-700">
                  <span className="text-amber-500">💡</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Related — ko 전용 (요약 데이터에 번역 제목이 없어 non-ko 는 숨김, 서버 body 에도 없음) */}
        {isKo && sameCategoryBooks.length > 0 && (
          <Section title="같이 보면 좋은 책">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {sameCategoryBooks.map((b) => (
                <Link
                  key={b.id}
                  to={`/library/${b.id}/about`}
                  className="block rounded-xl border border-slate-200 bg-white overflow-hidden hover:shadow-pop transition"
                >
                  <div className="aspect-video bg-slate-100">
                    {b.coverImage && (
                      <img
                        src={b.coverImage}
                        alt={b.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="p-2 text-sm font-bold text-slate-800 line-clamp-2">{b.title}</div>
                </Link>
              ))}
            </div>
          </Section>
        )}

        {/* CTA bottom */}
        <div className="mt-12 text-center">
          <Link
            to={`/library/${storybook.id}`}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-coral-500 text-white font-black text-lg hover:bg-coral-600 shadow-pop"
          >
            ⭐ {isKo ? '지금 우리 아이와 함께 읽기' : fill(S.readNow, displayTitle)}
          </Link>
          <div className="mt-3 text-xs text-slate-500">
            {isKo && <>탱고북에서 함께 — 아이와 부모를 위한 AI 동화책 플랫폼 · </>}
            <Link to={hubHref} className="underline hover:text-coral-600">
              {isClassics ? S.classicsHubLink : S.natureHubLink}
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-black text-slate-900 mb-3 border-l-4 border-coral-500 pl-3">
        {title}
      </h2>
      {children}
    </section>
  );
}
