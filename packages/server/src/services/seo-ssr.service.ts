/**
 * SEO SSR-lite — /library/:id/about 요청에 서버가 직접 meta/JSON-LD/본문을 주입한다.
 *
 * 배경: SPA 런타임 주입(BookSeoPage useEffect)은 네이버 Yeti 등 JS 미실행 크롤러에게
 * 보이지 않고, puppeteer prerender 는 배포 파이프라인에 미통합 상태였다(149권 전부
 * 범용 index.html 로 서빙 → canonical 이 홈 고정 = "홈 복사본 149장"). 서버는 이미
 * R2 저장소를 들고 있으므로 요청 시점에 head 치환 + #root 본문 주입이 가장 견고하다.
 * React 는 createRoot().render() 라 주입된 본문은 브라우저에서 자연히 교체된다.
 */
import type { Storybook, StorybookSummary, ReadingLevel, ParentGuide } from '@tangobook/shared';
import {
  SUPPORTED_LANGUAGES,
  seoStrings,
  fill,
  HUB_STRINGS,
  LANDING_STRINGS,
} from '@tangobook/shared';
import type { BlogPostDetail, BlogPostSummary } from './mkt/blog-public.service.js';

export const SITE_URL = 'https://www.tangobook.co.kr';

const LANG_CODES: string[] = SUPPORTED_LANGUAGES.map((l) => l.code);

/** ko = bare 경로 (기제출 sitemap 보존), 그 외 = /lang 프리픽스 */
export function langPrefix(lang: string): string {
  return lang === 'ko' ? '' : `/${lang}`;
}

/**
 * 해당 언어의 about 페이지가 존재하는가 — 🔴 언어 추가 자동화의 핵심 술어.
 * 번역 apply 가 titleTranslations + parentGuideTranslations 를 채우면
 * hreflang·sitemap·SSR 라우트가 전부 여기서 자동 derive 된다 (코드 변경 0).
 */
export function hasAboutLang(storybook: Storybook, lang: string): boolean {
  if (lang === 'ko') return true;
  if (!LANG_CODES.includes(lang)) return false;
  const sb = storybook as Storybook & {
    titleTranslations?: Record<string, string>;
    parentGuideTranslations?: Record<string, ParentGuide>;
  };
  return Boolean(sb.titleTranslations?.[lang] && sb.parentGuideTranslations?.[lang]);
}

const LEVEL_INFO: Record<ReadingLevel, { label: string; age: string; min: number; max: number }> = {
  L1: { label: '씨앗', age: '3~4세', min: 3, max: 4 },
  L2: { label: '새싹', age: '4~6세', min: 4, max: 6 },
  L3: { label: '나무', age: '6~7세', min: 6, max: 7 },
};

export interface AboutSeo {
  title: string;
  description: string;
  canonical: string;
  ogImage: string;
  jsonLdHtml: string;
  bodyHtml: string;
  /** hreflang 상호 링크 (<link rel="alternate">) — 없으면 빈 문자열 */
  alternatesHtml: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function summarize(text: string, max = 158): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1).replace(/[,;:\s]\S*$/, '') + '…';
}

/** 한글 파일명 등 non-ASCII URL 을 OG 스크레이퍼가 읽을 수 있게 percent-encode. */
function encodeUrl(url: string): string {
  if (!url) return '';
  try {
    return encodeURI(decodeURI(url)); // 이미 인코딩된 URL 이중 인코딩 방지
  } catch {
    return encodeURI(url);
  }
}

/** 마지막 한글 음절의 받침 유무에 따라 조사 선택 (이/가, 으로/로). */
function josa(word: string, withBatchim: string, noBatchim: string): string {
  const last = word.replace(/[^가-힣]+$/, '').slice(-1);
  if (!last) return noBatchim;
  const jong = (last.charCodeAt(0) - 0xac00) % 28;
  // 로/으로 는 ㄹ 받침(jong=8)이면 '로'
  if (noBatchim === '로' && jong === 8) return noBatchim;
  return jong > 0 ? withBatchim : noBatchim;
}

function pickKoreanWord(k: { korean?: string; name?: string }): string {
  const HANGUL = /[가-힣]/;
  const korean = (k.korean || '').trim();
  if (korean && HANGUL.test(korean)) return korean;
  const name = (k.name || '').trim();
  return HANGUL.test(name) ? name : '';
}

export function renderAboutSeo(storybook: Storybook, lang: string = 'ko'): AboutSeo {
  const sb = storybook as Storybook & {
    key_objects?: Array<{
      korean?: string;
      name?: string;
      definition?: string;
      example?: string;
      nameTranslations?: Record<string, string>;
    }>;
    titleTranslations?: Record<string, string>;
    parentGuideTranslations?: Record<string, ParentGuide>;
  };
  const isKo = lang === 'ko';
  const S = seoStrings(lang);
  const displayTitle = isKo ? sb.title : (sb.titleTranslations?.[lang] ?? sb.title);
  const guide = isKo ? sb.parentGuide : (sb.parentGuideTranslations?.[lang] ?? sb.parentGuide);

  const title = fill(S.aboutTitle, displayTitle);
  const overview = guide?.overview || `${displayTitle} — Tangobook`;
  const description = summarize(overview);
  const canonical = `${SITE_URL}${langPrefix(lang)}/library/${sb.id}/about`;
  const ogImage = encodeUrl(sb.coverImage || sb.coverImages?.[0]?.imageUrl || '');
  const level = sb.readingLevel ? LEVEL_INFO[sb.readingLevel] : null;
  const lessons = guide?.lessons ?? [];
  const tips = guide?.readingTips ?? [];
  const faqs = guide?.faq ?? [];
  const words = (sb.key_objects ?? [])
    .map((k) => ({
      ko: isKo ? pickKoreanWord(k) : (k.nameTranslations?.[lang] ?? pickKoreanWord(k)),
      definition: isKo ? k.definition : undefined, // 정의문은 ko 전용 (번역 없음)
      example: isKo ? k.example : undefined,
    }))
    .filter((w) => w.ko);

  // hreflang — 번역이 존재하는 언어들만 상호 링크 + x-default(ko)
  const altLangs = LANG_CODES.filter((l) => hasAboutLang(storybook, l));
  const alternatesHtml =
    altLangs.length > 1
      ? altLangs
          .map(
            (l) =>
              `<link rel="alternate" hreflang="${l}" href="${SITE_URL}${langPrefix(l)}/library/${sb.id}/about" />`
          )
          .join('\n    ') +
        `\n    <link rel="alternate" hreflang="x-default" href="${SITE_URL}/library/${sb.id}/about" />`
      : '';

  // ── JSON-LD ────────────────────────────────────────────────────────────────
  const schemas: object[] = [];
  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: displayTitle,
    description: overview,
    url: canonical,
    image: ogImage || undefined,
    inLanguage: [lang],
    numberOfPages: sb.pages?.length,
    isAccessibleForFree: sb.isAccessibleForFree ?? true,
    publisher: { '@type': 'Organization', name: '탱고북', url: SITE_URL },
    audience: level
      ? { '@type': 'PeopleAudience', suggestedMinAge: level.min, suggestedMaxAge: level.max }
      : undefined,
  });
  if (faqs.length) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    });
  }
  schemas.push({
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
        name: sb.category || S.h1Suffix,
        item: `${SITE_URL}/library?category=${encodeURIComponent(sb.category || '')}`,
      },
      { '@type': 'ListItem', position: 3, name: displayTitle, item: canonical },
    ],
  });
  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: displayTitle,
    description: overview,
    url: canonical,
    educationalLevel: level?.label ?? '유아',
    educationalUse: '어휘 학습, 정서 발달, 함께 읽기',
    inLanguage: [lang],
    teaches: words.slice(0, 20).map((w) => w.ko),
    provider: { '@type': 'Organization', name: '탱고북', url: SITE_URL },
  });
  const jsonLdHtml = schemas
    .map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`)
    .join('\n    ');

  // ── 본문 (JS 미실행 크롤러용 — 브라우저에선 React 가 교체) ─────────────────
  const t = escapeHtml(displayTitle);
  // ko 는 조사(이/가·으로/로) 처리, 그 외 언어는 SEO_STRINGS 템플릿
  const lessonsHeading = isKo
    ? `${t}${josa(sb.title, '이', '가')} 주는 교훈`
    : escapeHtml(fill(S.lessonsHeading, displayTitle));
  const wordsHeading = isKo
    ? `${t}${josa(sb.title, '으로', '로')} 배우는 유아 단어`
    : escapeHtml(fill(S.wordsHeading, displayTitle));

  const parts: string[] = [];
  parts.push(`<article><h1>${t} ${S.h1Suffix}</h1>`);
  parts.push(`<p>${escapeHtml(overview)}</p>`);
  if (level)
    parts.push(
      `<p>${S.ageLabel}: ${level.age}${isKo ? ` (${level.label})` : ''} · ${sb.pages?.length ?? 0}${S.pagesLabel}</p>`
    );
  if (lessons.length) {
    parts.push(
      `<h2>${lessonsHeading}</h2><ul>${lessons.map((l) => `<li>${escapeHtml(l)}</li>`).join('')}</ul>`
    );
  }
  if (words.length) {
    parts.push(
      `<h2>${wordsHeading}</h2><ul>${words
        .map(
          (w) =>
            `<li><strong>${escapeHtml(w.ko)}</strong>${w.definition ? ` — ${escapeHtml(w.definition)}` : ''}</li>`
        )
        .join('')}</ul>`
    );
  }
  if (faqs.length) {
    parts.push(
      `<h2>${S.faqHeading}</h2>${faqs
        .map((f) => `<h3>${escapeHtml(f.q)}</h3><p>${escapeHtml(f.a)}</p>`)
        .join('')}`
    );
  }
  if (tips.length) {
    parts.push(
      `<h2>${escapeHtml(fill(S.tipsHeading, displayTitle))}</h2><ul>${tips.map((x) => `<li>${escapeHtml(x)}</li>`).join('')}</ul>`
    );
  }
  // 카테고리 허브로 내부링크 — 해당 언어 허브 카피가 있으면 언어 경로로
  const isClassics = sb.category === '세계 명작';
  const hubLangPrefix = isKo || HUB_STRINGS[lang] ? langPrefix(lang) : '';
  const hubHref = `${hubLangPrefix}${isClassics ? '/guide/classics' : '/guide/nature'}`;
  const hubLabel = isClassics ? S.classicsHubLink : S.natureHubLink;
  parts.push(
    `<p><a href="/library/${sb.id}">${escapeHtml(fill(S.readNow, displayTitle))}</a> · <a href="${hubHref}">${escapeHtml(hubLabel)}</a></p></article>`
  );

  return {
    title: escapeHtml(title),
    description: escapeHtml(description),
    canonical,
    ogImage,
    jsonLdHtml,
    bodyHtml: parts.join(''),
    alternatesHtml,
  };
}

// ── 블로그 SSR ────────────────────────────────────────────────────────────────

/** 블로그 카드 이미지 URL — 이미 퍼센트 인코딩돼 있으면 유지(이중 인코딩 방지). client BlogCards.safeSrc 와 동일 규칙. */
function safeSrc(u: string): string {
  try {
    if (decodeURI(u) !== u) return u;
  } catch {
    return u;
  }
  return encodeURI(u);
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

/** mkt_blog_cards → 크롤러용 본문 HTML. 저작도구 신뢰 콘텐츠라 text/quote/list HTML 은 그대로. */
function renderCardsHtml(cards: BlogPostDetail['cards']): string {
  const parts: string[] = [];
  for (const c of cards) {
    const ct = c.content ?? {};
    if (c.type === 'divider') {
      parts.push('<hr/>');
      continue;
    }
    if (c.type === 'image') {
      const url = str(ct.url) || str(ct.image_url);
      if (!url) continue;
      parts.push(
        `<figure><img src="${safeSrc(url)}" alt="${escapeHtml(str(ct.alt))}"/>${
          str(ct.caption) ? `<figcaption>${escapeHtml(str(ct.caption))}</figcaption>` : ''
        }</figure>`
      );
      continue;
    }
    if (c.type === 'quote') {
      parts.push(`<blockquote>${str(ct.html) || escapeHtml(str(ct.text))}</blockquote>`);
      continue;
    }
    if (c.type === 'list' && Array.isArray(ct.items)) {
      parts.push(`<ul>${(ct.items as unknown[]).map((it) => `<li>${str(it)}</li>`).join('')}</ul>`);
      continue;
    }
    // text (기본) — 저작 HTML 그대로 + 결합 삽화
    const html = str(ct.html) || str(ct.text);
    const imgUrl = str(ct.url) || str(ct.image_url);
    if (html) parts.push(html);
    if (imgUrl)
      parts.push(
        `<figure><img src="${safeSrc(imgUrl)}" alt="${escapeHtml(str(ct.alt))}"/></figure>`
      );
  }
  return parts.join('');
}

export function renderBlogSeo(post: BlogPostDetail): AboutSeo {
  const canonical = `${SITE_URL}/blog/${encodeURIComponent(post.slug)}`;
  const firstImage = post.cards
    .map((c) => str(c.content?.url) || str(c.content?.image_url))
    .find(Boolean);
  const ogImage = firstImage ? safeSrc(firstImage) : `${SITE_URL}/og-image.png`;
  const description = summarize(post.description || post.title);

  const schemas: object[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.description || undefined,
      url: canonical,
      image: ogImage,
      datePublished: post.publishedAt || undefined,
      inLanguage: ['ko'],
      keywords: post.primaryKeyword || undefined,
      publisher: { '@type': 'Organization', name: '탱고북', url: SITE_URL },
      mainEntityOfPage: canonical,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '블로그', item: `${SITE_URL}/blog` },
        { '@type': 'ListItem', position: 2, name: post.title, item: canonical },
      ],
    },
  ];

  const bodyParts = [
    `<article><h1>${escapeHtml(post.title)}</h1>`,
    renderCardsHtml(post.cards),
    post.storybookId
      ? `<p><a href="/library/${post.storybookId}/about">이 이야기를 그림책으로 — 탱고북에서 읽기</a></p>`
      : '',
    `<p><a href="/blog">탱고북 블로그 전체 보기</a></p></article>`,
  ];

  return {
    title: escapeHtml(`${post.title} | 탱고북 블로그`),
    description: escapeHtml(description),
    canonical,
    ogImage,
    jsonLdHtml: schemas
      .map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`)
      .join('\n    '),
    bodyHtml: bodyParts.join(''),
    alternatesHtml: '', // 블로그는 ko 전용
  };
}

export function renderBlogListSeo(posts: BlogPostSummary[]): AboutSeo {
  const canonical = `${SITE_URL}/blog`;
  const title = '탱고북 블로그 — 유아 동화·자연관찰 그림책 가이드';
  const description =
    '세계 명작 동화 줄거리와 교훈, 동물·곤충·공룡·식물 자연관찰 이야기까지 — 4~7세 아이와 함께 읽는 그림책 가이드.';
  const items = posts
    .map((p) => `<li><a href="/blog/${encodeURIComponent(p.slug)}">${escapeHtml(p.title)}</a></li>`)
    .join('');
  return {
    title: escapeHtml(`${title}`),
    description: escapeHtml(description),
    canonical,
    ogImage: `${SITE_URL}/og-image.png`,
    jsonLdHtml: `<script type="application/ld+json">${JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: title,
      url: canonical,
      publisher: { '@type': 'Organization', name: '탱고북', url: SITE_URL },
    })}</script>`,
    bodyHtml: `<article><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p><ul>${items}</ul></article>`,
    alternatesHtml: '',
  };
}

// ── 카테고리 허브 SSR ─────────────────────────────────────────────────────────
// 152개 블로그가 secondary 로 나눠 갖던 카테고리 키워드("유아 명작 동화" 51회 등)를
// 모아 받는 허브. 개별 책 about + 블로그가 여기로 내부링크한다.

export interface HubConfig {
  slug: string;
  /** 세계 명작 = classics, 그 외 전부 = nature */
  isClassics: boolean;
  title: string;
  h1: string;
  intro: string;
}

export const HUBS: Record<'classics' | 'nature', HubConfig> = {
  classics: {
    slug: 'classics',
    isClassics: true,
    title: '세계 명작 동화 전집 — 4~7세 명작 그림책 | 탱고북',
    h1: '세계 명작 동화 전집 (4~7세 그림책)',
    intro:
      '신데렐라·백설공주·인어공주부터 어린 왕자·오즈의 마법사까지 — 유아 명작 동화를 아이 눈높이 그림책으로 다시 만들었어요. 한글·영어 나레이션과 단어 학습, 부모님 가이드가 함께 있는 세계명작동화 전집입니다. 각 책의 줄거리·교훈·읽어주기 팁을 확인해 보세요.',
  },
  nature: {
    slug: 'nature',
    isClassics: false,
    title: '자연관찰 그림책 — 동물·곤충·공룡·식물 | 탱고북',
    h1: '자연관찰 그림책 (동물·곤충·공룡·식물)',
    intro:
      '공룡 친구들부터 곤충, 바다·육지·하늘 동물, 식물과 우주까지 — 4~7세 유아 자연관찰 책을 실사 대신 따뜻한 그림책으로 만들었어요. 동물 그림책·공룡 그림책을 찾고 있다면 아이와 함께 한 권씩 관찰해 보세요. 책마다 핵심 단어 학습과 부모님 가이드가 들어 있어요.',
  },
};

/** 허브 대상 책 필터 — 세계 명작 vs 나머지(자연관찰 계열). */
export function filterHubBooks(hub: HubConfig, books: StorybookSummary[]): StorybookSummary[] {
  return books.filter((b) =>
    hub.isClassics ? b.category === '세계 명작' : b.category !== '세계 명작'
  );
}

/** 허브가 존재하는 언어들 — ko + HUB_STRINGS 에 카피가 있는 언어 */
export function hubLangs(): string[] {
  return ['ko', ...Object.keys(HUB_STRINGS)];
}

export function renderHubSeo(
  hub: HubConfig,
  books: StorybookSummary[],
  lang: string = 'ko'
): AboutSeo {
  const isKo = lang === 'ko';
  const copy = isKo
    ? { title: hub.title, h1: hub.h1, intro: hub.intro }
    : HUB_STRINGS[lang]?.[hub.slug as 'classics' | 'nature'];
  // 카피 없는 언어는 ko 로 폴백 (라우트에서 hubLangs 로 걸러지지만 방어)
  const c = copy ?? { title: hub.title, h1: hub.h1, intro: hub.intro };
  const S = seoStrings(lang);

  const withT = books as Array<StorybookSummary & { titleTranslations?: Record<string, string> }>;
  const list = filterHubBooks(hub, books).filter(
    (b) => isKo || (b as (typeof withT)[number]).titleTranslations?.[lang]
  ) as typeof withT;
  const displayTitle = (b: (typeof withT)[number]) =>
    isKo ? b.title : (b.titleTranslations?.[lang] ?? b.title);
  const aboutHref = (b: { id: string }) => `${langPrefix(lang)}/library/${b.id}/about`;

  const canonical = `${SITE_URL}${langPrefix(lang)}/guide/${hub.slug}`;
  const description = summarize(c.intro);

  // hreflang — 허브 카피가 존재하는 언어들 상호 링크
  const alternatesHtml =
    hubLangs()
      .map(
        (l) =>
          `<link rel="alternate" hreflang="${l}" href="${SITE_URL}${langPrefix(l)}/guide/${hub.slug}" />`
      )
      .join('\n    ') +
    `\n    <link rel="alternate" hreflang="x-default" href="${SITE_URL}/guide/${hub.slug}" />`;

  const schemas: object[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: c.h1,
      description: c.intro,
      url: canonical,
      inLanguage: [lang],
      publisher: { '@type': 'Organization', name: '탱고북', url: SITE_URL },
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: list.length,
        itemListElement: list.slice(0, 60).map((b, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: displayTitle(b),
          url: `${SITE_URL}${aboutHref(b)}`,
        })),
      },
    },
  ];

  // 카테고리별 그룹 (nature 허브 가독성) — 카테고리명은 ko 유지(고유 브랜드 섹션명)
  const byCategory = new Map<string, typeof withT>();
  for (const b of list) {
    const cat = b.category || '기타';
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(b);
  }
  const sections = [...byCategory.entries()]
    .map(
      ([cat, items]) =>
        `<h2>${escapeHtml(cat)} (${items.length})</h2><ul>${items
          .map(
            (b) =>
              `<li><a href="${aboutHref(b)}">${escapeHtml(displayTitle(b))}${isKo ? ' 동화책' : ''}</a></li>`
          )
          .join('')}</ul>`
    )
    .join('');

  return {
    title: escapeHtml(c.title),
    description: escapeHtml(description),
    canonical,
    ogImage: `${SITE_URL}/og-image.png`,
    jsonLdHtml: schemas
      .map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`)
      .join('\n    '),
    bodyHtml: `<article><h1>${escapeHtml(c.h1)}</h1><p>${escapeHtml(c.intro)}</p>${sections}<p><a href="/library">${escapeHtml(S.libraryBreadcrumb)}</a> · <a href="/blog">${escapeHtml(S.blogListLink)}</a></p></article>`,
    alternatesHtml,
  };
}

/** 태그 하나를 치환(멀티라인 속성 허용). 못 찾으면 무시(주입 단계에서 append). */
function replaceTag(html: string, pattern: RegExp, replacement: string): string {
  return pattern.test(html) ? html.replace(pattern, replacement) : html;
}

const metaPattern = (attr: 'name' | 'property', key: string) =>
  new RegExp(`<meta\\s+${attr}="${key.replace(/[:]/g, '\\$&')}"\\s+content="[\\s\\S]*?"\\s*/?>`);
const metaPatternMultiline = (attr: 'name' | 'property', key: string) =>
  new RegExp(
    `<meta\\s*\\n?\\s*${attr}="${key.replace(/[:]/g, '\\$&')}"\\s*\\n?\\s*content="[\\s\\S]*?"\\s*\\n?\\s*/?>`
  );

/**
 * 언어별 진입/랜딩(/en·/vi·/zh·/th·/ko) OG·title — 소셜 공유 미리보기가 해당 언어로 뜨게.
 * SPA 는 그대로 부팅(LangEntry 가 리다이렉트)하고, 크롤러만 이 주입된 head 를 읽는다.
 */
export function renderLandingSeo(lang: string): AboutSeo | null {
  const s = LANDING_STRINGS[lang];
  if (!s) return null;
  const langs = Object.keys(LANDING_STRINGS);
  const alternatesHtml =
    langs
      .map((l) => `<link rel="alternate" hreflang="${l}" href="${SITE_URL}${langPrefix(l)}" />`)
      .join('') + `<link rel="alternate" hreflang="x-default" href="${SITE_URL}" />`;
  return {
    title: escapeHtml(s.title),
    description: escapeHtml(s.description),
    canonical: `${SITE_URL}${langPrefix(lang)}`,
    ogImage: `${SITE_URL}/og-image.png`,
    jsonLdHtml: '',
    bodyHtml: '',
    alternatesHtml,
  };
}

export function injectAboutSeo(indexHtml: string, seo: AboutSeo): string {
  let html = indexHtml;

  html = replaceTag(html, /<title>[\s\S]*?<\/title>/, `<title>${seo.title}</title>`);
  html = replaceTag(
    html,
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/,
    `<link rel="canonical" href="${seo.canonical}" />`
  );

  const metas: Array<['name' | 'property', string, string]> = [
    ['name', 'description', seo.description],
    ['property', 'og:type', 'article'],
    ['property', 'og:url', seo.canonical],
    ['property', 'og:title', seo.title],
    ['property', 'og:description', seo.description],
    ['name', 'twitter:title', seo.title],
    ['name', 'twitter:description', seo.description],
  ];
  if (seo.ogImage) metas.push(['property', 'og:image', seo.ogImage]);

  for (const [attr, key, value] of metas) {
    const tag = `<meta ${attr}="${key}" content="${value}" />`;
    const single = metaPattern(attr, key);
    const multi = metaPatternMultiline(attr, key);
    if (single.test(html)) html = html.replace(single, tag);
    else if (multi.test(html)) html = html.replace(multi, tag);
    else html = html.replace('</head>', `  ${tag}\n  </head>`);
  }

  // hreflang 상호 링크 (다국어 페이지)
  if (seo.alternatesHtml) {
    html = html.replace('</head>', `  ${seo.alternatesHtml}\n  </head>`);
  }

  // 책 JSON-LD 는 사이트 Organization 스키마와 공존 — head 끝에 append
  html = html.replace('</head>', `  ${seo.jsonLdHtml}\n  </head>`);

  // 본문 — #root 안에 주입 (React createRoot 가 마운트 시 교체)
  html = html.replace('<div id="root"></div>', `<div id="root">${seo.bodyHtml}</div>`);

  return html;
}
