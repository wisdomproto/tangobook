import { describe, it, expect } from 'vitest';
import { renderAboutSeo, injectAboutSeo } from './seo-ssr.service.js';
import type { Storybook } from '@tangobook/shared';

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
