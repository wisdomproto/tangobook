import { describe, it, expect } from 'vitest';
import {
  renderAboutSeo,
  injectAboutSeo,
  renderBlogSeo,
  renderBlogListSeo,
  renderHubSeo,
  HUBS,
} from './seo-ssr.service.js';
import type { Storybook } from '@tangobook/shared';
import type { BlogPostDetail, BlogPostSummary } from './mkt/blog-public.service.js';

// Minimal storybook fixture matching what the about page consumes
const book = {
  id: '1772009873865',
  title: '개구리 왕자',
  category: '세계 명작',
  readingLevel: 'L2',
  languages: ['ko', 'en'],
  coverImage: 'https://pub-x.r2.dev/storybooks/개구리 왕자/cover.webp',
  pages: [{ pageNumber: 1 }, { pageNumber: 2 }, { pageNumber: 3 }],
  key_objects: [
    {
      name: 'frog',
      korean: '개구리',
      definition: '물과 땅을 오가는 동물',
      example: '개구리가 폴짝 뛰어요.',
    },
    { name: 'crown', korean: '왕관', definition: '왕이 쓰는 모자' },
  ],
  parentGuide: {
    overview: '약속의 소중함을 배우는 그림 형제의 명작 동화입니다. 공주와 개구리의 이야기.',
    lessons: ['약속은 지켜야 해요', '겉모습으로 판단하지 않아요'],
    readingTips: ['개구리 목소리를 흉내 내며 읽어주세요'],
    faq: [{ q: '몇 살에 읽기 좋나요?', a: '4~6세에 적합합니다.' }],
  },
} as unknown as Storybook;

// A trimmed replica of client/index.html head structure (multi-line attrs included)
const INDEX_HTML = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <link rel="canonical" href="https://www.tangobook.co.kr/" />
    <title>탱고북 — 동화로 자라는 4-7세 한글·영어 학습 플랫폼</title>
    <meta
      name="description"
      content="4-7세 아이를 위한 AI 동화책."
    />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="탱고북" />
    <meta property="og:url" content="https://www.tangobook.co.kr/" />
    <meta property="og:title" content="탱고북 — 동화로 자라는 4-7세 한글·영어 학습 플랫폼" />
    <meta
      property="og:description"
      content="AI 동화."
    />
    <meta property="og:image" content="https://www.tangobook.co.kr/og-image.png" />
    <meta name="twitter:title" content="탱고북 — 동화로 자라는 4-7세 한글·영어 학습 플랫폼" />
    <meta
      name="twitter:description"
      content="AI 동화."
    />
    <script type="application/ld+json">{"@type":"Organization"}</script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;

describe('renderAboutSeo', () => {
  const seo = renderAboutSeo(book);

  it('builds a book-specific title / description / canonical (always www)', () => {
    expect(seo.title).toContain('개구리 왕자');
    expect(seo.title).toContain('탱고북');
    expect(seo.description).toContain('약속의 소중함');
    expect(seo.canonical).toBe('https://www.tangobook.co.kr/library/1772009873865/about');
  });

  it('percent-encodes non-ASCII cover image URL for og:image', () => {
    expect(seo.ogImage).not.toContain('개구리 왕자');
    expect(seo.ogImage).toContain('%EA%B0%9C%EA%B5%AC%EB%A6%AC%20%EC%99%95%EC%9E%90');
  });

  it('renders Book + FAQPage + BreadcrumbList + LearningResource JSON-LD', () => {
    expect(seo.jsonLdHtml).toContain('"@type":"Book"');
    expect(seo.jsonLdHtml).toContain('"@type":"FAQPage"');
    expect(seo.jsonLdHtml).toContain('"@type":"BreadcrumbList"');
    expect(seo.jsonLdHtml).toContain('"@type":"LearningResource"');
  });

  it('omits FAQPage JSON-LD when the book has no faq', () => {
    const noFaq = { ...book, parentGuide: { ...(book as any).parentGuide, faq: [] } } as Storybook;
    expect(renderAboutSeo(noFaq).jsonLdHtml).not.toContain('FAQPage');
  });

  it('selects Korean josa by final consonant (헨젤과 그레텔이 / 개구리 왕자가)', () => {
    // 받침 있는 제목 (그레텔 → ㄹ 이지만 이/가 는 받침이면 '이')
    const batchim = { ...book, title: '헨젤과 그레텔' } as Storybook;
    expect(renderAboutSeo(batchim).bodyHtml).toContain('헨젤과 그레텔이 주는 교훈');
    expect(renderAboutSeo(batchim).bodyHtml).toContain('헨젤과 그레텔로 배우는 유아 단어'); // ㄹ받침=로
    // 받침 없는 제목
    expect(seo.bodyHtml).toContain('개구리 왕자가 주는 교훈');
    expect(seo.bodyHtml).toContain('개구리 왕자로 배우는 유아 단어');
    // 일반 받침 → 으로
    const eun = { ...book, title: '백설공주와 일곱 난쟁이들의 숲' } as Storybook;
    expect(renderAboutSeo(eun).bodyHtml).toContain('숲으로 배우는 유아 단어');
  });

  it('renders body article with h1, overview, lessons, key words and FAQ text', () => {
    expect(seo.bodyHtml).toContain('<h1');
    expect(seo.bodyHtml).toContain('개구리 왕자');
    expect(seo.bodyHtml).toContain('약속의 소중함');
    expect(seo.bodyHtml).toContain('약속은 지켜야 해요');
    expect(seo.bodyHtml).toContain('왕관');
    expect(seo.bodyHtml).toContain('몇 살에 읽기 좋나요?');
  });

  it('escapes HTML in user-visible fields', () => {
    const evil = {
      ...book,
      title: '<script>alert(1)</script>책',
    } as Storybook;
    const s = renderAboutSeo(evil);
    expect(s.bodyHtml).not.toContain('<script>alert(1)</script>');
    expect(s.title).not.toContain('<script>');
  });
});

describe('renderBlogSeo', () => {
  const post: BlogPostDetail = {
    slug: 'cinderella-fairy-tale-for-kids',
    title: '신데렐라 동화 줄거리와 교훈 — 아이에게 읽어주는 법',
    description: '신데렐라 줄거리와 교훈, 읽어주는 팁.',
    category: '명작동화',
    publishedAt: '2026-07-11T00:00:00Z',
    primaryKeyword: '신데렐라 동화',
    storybookId: '1772107608499',
    thumbnail: null,
    cards: [
      { type: 'text', content: { html: '<h2>줄거리</h2><p>옛날 옛적…</p>' } },
      { type: 'image', content: { url: 'https://pub-x.r2.dev/삽화 1.webp', alt: '신데렐라 삽화' } },
      { type: 'list', content: { items: ['교훈 하나', '교훈 둘'] } },
      { type: 'quote', content: { text: '인용문' } },
      { type: 'divider', content: {} },
    ],
  };
  const seo = renderBlogSeo(post);

  it('builds blog title/description/canonical', () => {
    expect(seo.title).toContain('신데렐라 동화 줄거리와 교훈');
    expect(seo.canonical).toBe('https://www.tangobook.co.kr/blog/cinderella-fairy-tale-for-kids');
    expect(seo.description).toContain('신데렐라 줄거리와 교훈');
  });

  it('uses first image card (percent-encoded) as og:image', () => {
    expect(seo.ogImage).toContain('%EC%82%BD%ED%99%94%201.webp');
  });

  it('renders BlogPosting JSON-LD with datePublished', () => {
    expect(seo.jsonLdHtml).toContain('"@type":"BlogPosting"');
    expect(seo.jsonLdHtml).toContain('2026-07-11');
  });

  it('renders body from cards: authored html passthrough, images, lists, quotes', () => {
    expect(seo.bodyHtml).toContain('<h1>신데렐라 동화 줄거리와 교훈');
    expect(seo.bodyHtml).toContain('<h2>줄거리</h2><p>옛날 옛적…</p>'); // 저작 HTML 그대로
    expect(seo.bodyHtml).toContain('<img src="https://pub-x.r2.dev/%EC%82%BD%ED%99%94%201.webp"');
    expect(seo.bodyHtml).toContain('alt="신데렐라 삽화"');
    expect(seo.bodyHtml).toContain('<li>교훈 하나</li>');
    expect(seo.bodyHtml).toContain('<blockquote>인용문</blockquote>');
  });
});

describe('renderBlogListSeo', () => {
  const posts: BlogPostSummary[] = [
    {
      slug: 'a-post',
      title: '포스트 A',
      description: '',
      category: null,
      publishedAt: null,
      thumbnail: null,
    },
    {
      slug: 'b-post',
      title: '포스트 B',
      description: '',
      category: null,
      publishedAt: null,
      thumbnail: null,
    },
  ];
  it('renders list page with links to every post', () => {
    const seo = renderBlogListSeo(posts);
    expect(seo.canonical).toBe('https://www.tangobook.co.kr/blog');
    expect(seo.bodyHtml).toContain('href="/blog/a-post"');
    expect(seo.bodyHtml).toContain('href="/blog/b-post"');
    expect(seo.bodyHtml).toContain('포스트 B');
  });
});

describe('renderHubSeo', () => {
  const summaries = [
    { id: '1', title: '신데렐라', category: '세계 명작', coverImage: 'https://x/신데렐라.webp' },
    { id: '2', title: '람포린쿠스', category: '공룡 친구들', coverImage: '' },
    { id: '3', title: '민들레', category: '식물 친구들', coverImage: '' },
  ] as any[];

  it('classics hub lists only 세계 명작 books with about links', () => {
    const seo = renderHubSeo(HUBS.classics, summaries);
    expect(seo.canonical).toBe('https://www.tangobook.co.kr/guide/classics');
    expect(seo.bodyHtml).toContain('href="/library/1/about"');
    expect(seo.bodyHtml).not.toContain('람포린쿠스');
    expect(seo.title).toContain('명작');
    expect(seo.jsonLdHtml).toContain('"@type":"CollectionPage"');
  });

  it('nature hub lists non-classics books', () => {
    const seo = renderHubSeo(HUBS.nature, summaries);
    expect(seo.bodyHtml).toContain('람포린쿠스');
    expect(seo.bodyHtml).toContain('민들레');
    expect(seo.bodyHtml).not.toContain('신데렐라');
  });
});

describe('injectAboutSeo', () => {
  const seo = renderAboutSeo(book);
  const html = injectAboutSeo(INDEX_HTML, seo);

  it('replaces <title> and canonical (no duplicate canonical)', () => {
    expect(html).toContain('개구리 왕자');
    expect(html.match(/<title>/g)).toHaveLength(1);
    expect(html.match(/rel="canonical"/g)).toHaveLength(1);
    expect(html).toContain('href="https://www.tangobook.co.kr/library/1772009873865/about"');
    expect(html).not.toContain('href="https://www.tangobook.co.kr/"');
  });

  it('replaces description / og / twitter tags with book values (multi-line attrs handled)', () => {
    expect(html).not.toContain('4-7세 아이를 위한 AI 동화책.');
    expect(html).toContain('약속의 소중함');
    // og:type flips to article; site_name preserved
    expect(html).toContain('property="og:type" content="article"');
    expect(html).toContain('property="og:site_name" content="탱고북"');
    // no duplicated og:title
    expect(html.match(/property="og:title"/g)).toHaveLength(1);
  });

  it('appends book JSON-LD while keeping the site Organization schema', () => {
    expect(html).toContain('"@type":"Organization"');
    expect(html).toContain('"@type":"Book"');
  });

  it('injects the article into #root for JS-less crawlers', () => {
    expect(html).toContain('<div id="root"><article');
    expect(html).toContain('</article></div>');
  });
});
