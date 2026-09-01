// 공개 블로그 글 — /blog/:slug. 발행된 자체 내부 블로그 1건 렌더 + 동화책 CTA.
import { Link, useParams } from 'react-router-dom';
import { useSeo } from '@/lib/useSeo';
import { SiteFooter } from '@/components/SiteFooter';
import { useBlogPost } from './api';
import { BlogCards } from './BlogCards';
import { useBlogLang } from './useBlogLang';
import { PhonicsTryIt } from '@/features/phonics-learner/components/PhonicsTryIt';

/**
 * 파닉스 글에서 「직접 해보기」가 들어갈 자리 — 앞 N개 섹션 뒤.
 * 32편이 같은 6섹션 구조(§2 가 「두 글자가 합쳐지는 순간」)를 쓰므로 고정값이다.
 */
const TRY_IT_AFTER = 3;

/**
 * 파닉스 **허브** 글 — 단원 하나가 아니라 여러 단원을 묶는 안내다(받침 7편, 자음 15편…).
 * 🔴 그래서 `storybookId` 가 가리키는 책이 없다. 책 CTA 를 그대로 쓰면 `/library/hub-batchim`
 *    같은 죽은 링크가 된다 → 커리큘럼으로 보낸다. 맛보기 활동은 대표 단원 것을 얹는다.
 */
const HUB_DEMO_UNIT: Record<string, string> = {
  'hub-jamo': 'kr-h1-u02',
  'hub-batchim': 'kr-h2-u01',
  'hub-ssangjaeum': 'kr-h3-u01',
  'hub-order': 'kr-h1-u01',
  'hub-hangul-home': 'kr-h1-u01',
};

/**
 * 파닉스 **롱테일** 글 — storybookId 가 책이 아니므로 대표 단원으로 매핑해 그 자리에서 활동을 임베드한다.
 *  - 쓰기 글(write-*): 그 단원의 **쓰기 activityKey 를 강제**(기본은 듣기라서). 🔴 key 는 그 단원 plan 의 실제 값(실측 2026-08).
 *  - 소리·읽기 글(read-*): activityKey 없음 = **기본 듣기 활동** 그대로가 맞다(누르면 소리).
 */
const PHONICS_DEMO: Record<string, { unit: string; activityKey?: string }> = {
  'write-consonant': { unit: 'kr-h1-u02', activityKey: 'consonant-write' },
  'write-vowel': { unit: 'kr-h1-u01', activityKey: 'write-1' },
  'write-batchim': { unit: 'kr-h2-u01', activityKey: 'consonant-write' },
  'write-ssangjaeum': { unit: 'kr-h3-u01', activityKey: 'consonant-write' },
  'read-consonant': { unit: 'kr-h1-u02' },
  'read-vowel': { unit: 'kr-h1-u01' },
  'read-batchim': { unit: 'kr-h2-u01' },
  'read-ganada': { unit: 'kr-h1-u02' },
};

/**
 * 자연 도감 롱테일 글 — storybookId 가 고유 슬러그(nature-*)라 그대로 `/library/…` 로 보내면
 * 죽은 링크가 된다. 실제 자연관찰 책 id 로 매핑해 CTA·hero 가 그 책을 가리키게 한다.
 * 🔴 실제 책 id 를 storybookId 로 쓰면 그 책의 기존 마케팅 콘텐츠와 충돌하므로 슬러그를 쓴다.
 */
const LINKED_BOOK: Record<string, string> = {
  'nature-spider': '1773320745960',
  'nature-dinosaur': '1773714531390',
  'nature-space': '1773411238323',
};

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

  /**
   * 파닉스 글이면 그 단원 id — 본문 중간에 **진짜 활동**을 얹는다(2026-07-29).
   * 웹앱이라 가능한 것이고, 스크린샷으로는 「두 글자가 합쳐지는 순간」을 전할 방법이 없다.
   * 🔴 한국어 글에만 — 활동 화면 글자가 전부 한국어라 영어 독자에겐 맞지 않는다.
   */
  const hubUnit = post?.storybookId ? HUB_DEMO_UNIT[post.storybookId] : undefined;
  const phonicsDemo = post?.storybookId ? PHONICS_DEMO[post.storybookId] : undefined;
  const phonicsUnit =
    lang === 'ko' && post?.storybookId?.startsWith('kr-h')
      ? post.storybookId
      : lang === 'ko' && hubUnit
        ? hubUnit
        : lang === 'ko' && phonicsDemo
          ? phonicsDemo.unit
          : null;
  // 쓰기 글만 그 단원의 **쓰기 활동**을 강제(기본은 듣기). 읽기·소리 글은 undefined = 기본 듣기.
  const phonicsActivityKey = phonicsDemo?.activityKey;

  // 위/아래 CTA 링크 — 파닉스는 **동화 뷰어가 아니라 학습 페이지**로 보낸다(사용자 2026-08-01).
  //   허브 → 커리큘럼 랜딩 / 파닉스 단원 → 그 단원 학습 페이지 / 그 외 → 동화책 상세.
  // ⚠️ 비-ko 는 `/{lang}?to=…`(LangEntry) 그대로 둔다. 로그인 사용자는 자기 UI 언어를 유지하는 게
  //    규칙이라 한국어로 열리는데, 그건 2026-07-13 에 정한 의도된 동작이다(사용자 확인 2026-07-29).
  // 자연 도감 슬러그는 실제 책 id 로 치환(그 외 책 블로그는 storybookId 가 이미 실제 id).
  const linkedBookId = post?.storybookId
    ? (LINKED_BOOK[post.storybookId] ?? post.storybookId)
    : null;
  const bookHref = hubUnit
    ? '/library/phonics/korean' // 허브는 책이 아니라 커리큘럼으로
    : phonicsUnit
      ? `/library/phonics/korean/${phonicsUnit}` // 파닉스 단원 → 그 단원 학습 화면
      : linkedBookId
        ? lang === 'ko'
          ? `/library/${linkedBookId}`
          : `/${lang}?to=${encodeURIComponent(`/library/${linkedBookId}`)}`
        : null;

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
                  {/* 🔴 맨 위 CTA (2026-07-29) — 아래까지 안 읽고 이탈하는 독자를 위해.
                      본문 앞을 막지 않도록 **한 줄 바**로 두고, 닫는 제안은 하단 코랄 카드가 맡는다. */}
                  {bookHref && (
                    <Link
                      to={bookHref}
                      className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-coral-200 bg-coral-50 px-4 py-3 transition hover:bg-coral-100"
                    >
                      <span className="text-sm font-semibold text-ink-700 break-keep">
                        {/* 파닉스(허브·단원)는 동화가 아니라 학습으로 보내므로 「이야기/그림책」 카피가
                            맞지 않는다. 파닉스 글은 한국어 전용이라 이 분기만 한국어를 직접 쓴다. */}
                        {hubUnit
                          ? '32단원 전부 무료로 열려 있어요'
                          : phonicsUnit
                            ? '이 단원, 앱에서 직접 눌러보며 익혀요'
                            : t('topCta')}
                      </span>
                      <span className="shrink-0 rounded-full bg-coral-500 px-4 py-1.5 text-xs font-bold text-white">
                        {hubUnit
                          ? '한글 파닉스 →'
                          : phonicsUnit
                            ? '파닉스 배우기 →'
                            : t('topCtaButton')}
                      </span>
                    </Link>
                  )}

                  <div className="mt-6 h-px w-full bg-ink-100" />
                </div>

                <div className="px-6 pb-9 pt-6 sm:px-10 sm:pb-11">
                  {phonicsUnit ? (
                    <>
                      {/* 🔴 임베드는 **그 얘기를 한 섹션 바로 뒤**에 온다 — 맨 끝에 두면 이미 다
                          읽고 난 뒤라 「직접 해보세요」가 뒷북이다. 파닉스 32편이 같은 6섹션
                          구조를 쓰므로 자리는 고정(§2 「합쳐지는 순간」 다음 = 앞 3장 뒤). */}
                      <BlogCards cards={post.cards.slice(0, TRY_IT_AFTER)} />
                      <PhonicsTryIt unitId={phonicsUnit} activityKey={phonicsActivityKey} />
                      <BlogCards cards={post.cards.slice(TRY_IT_AFTER)} />
                    </>
                  ) : (
                    <BlogCards cards={post.cards} />
                  )}
                </div>
              </article>

              {/* 하단 CTA — 파닉스는 학습, 그 외는 동화책 */}
              {post.storybookId && (
                <div className="mt-6 flex flex-col items-center gap-3 rounded-[2rem] border border-coral-200 bg-gradient-to-br from-coral-100 to-peach-200 p-7 text-center">
                  <p className="text-base font-bold text-ink-900 break-keep">
                    {hubUnit
                      ? '한글 파닉스 32단원 🌳'
                      : phonicsUnit
                        ? '한글 파닉스로 직접 배워보세요 🌳'
                        : t('ctaTitle')}
                  </p>
                  <p className="text-xs text-ink-600 break-keep">
                    {hubUnit
                      ? '모음 · 자음 · 받침 · 쌍자음 · 복잡한 모음까지 순서대로 열려 있어요.'
                      : phonicsUnit
                        ? '듣고, 쓰고, 놀면서 이 단원을 앱에서 익혀요.'
                        : t('ctaDesc')}
                  </p>
                  <Link
                    to={bookHref!}
                    className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-coral-500 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-coral-600"
                  >
                    {hubUnit
                      ? '한글 파닉스 시작하기 →'
                      : phonicsUnit
                        ? '파닉스 배우기 →'
                        : t('ctaButton')}
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
