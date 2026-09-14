import { describe, it, expect } from 'vitest';
import { buildCatalog, renderActivitySeo, renderActivityHubSeo } from './seo-activity.service.js';

const catalog = buildCatalog(
  [
    {
      key: 'ph-0389',
      group: '한글 파닉스',
      section: 's',
      unitId: 'kr-h1-u01',
      word: '아이',
      language: 'korean',
      lineartUrl: '/api/r2-proxy?key=a',
    },
    {
      key: 'bk-0001',
      group: '세계 명작',
      section: '개구리 왕자',
      bookId: '177',
      bookTitle: '개구리 왕자',
      word: '공',
      lineartUrl: '/api/r2-proxy?key=b',
      blurb: '둥근 공',
    },
  ],
  [
    {
      key: 'jr-0034',
      bookId: '9',
      bookTitle: '팥죽 할멈',
      category: '전래 동화',
      sceneImageUrl: 'https://x/s.jpg',
      words: ['팥죽', '호랑이'],
    },
  ]
);

describe('renderActivitySeo', () => {
  it('coloring page: title, canonical, absolute og image, body text, source link', () => {
    const seo = renderActivitySeo('coloring', 'bk-0001-공-개구리-왕자', catalog);
    if (!seo || 'redirect' in seo) throw new Error('expected page');
    expect(seo.title).toContain('공 색칠도안');
    expect(seo.canonical).toBe(
      'https://www.tangobook.co.kr/activity/coloring/' +
        encodeURIComponent('bk-0001-공-개구리-왕자')
    );
    expect(seo.ogImage.startsWith('https://www.tangobook.co.kr/api/r2-proxy')).toBe(true);
    expect(seo.bodyHtml).toContain('둥근 공');
    expect(seo.bodyHtml).toContain('href="/library/177"');
  });

  it('non-canonical slug → redirect, unknown key → null', () => {
    expect(renderActivitySeo('coloring', 'bk-0001', catalog)).toEqual({
      redirect: '/activity/coloring/' + encodeURIComponent('bk-0001-공-개구리-왕자'),
    });
    expect(renderActivitySeo('coloring', 'bk-9999-x', catalog)).toBeNull();
  });

  it('hidden-object and worksheet pages render', () => {
    const h = renderActivitySeo('hidden-object', 'jr-0034-팥죽-할멈', catalog);
    if (!h || 'redirect' in h) throw new Error('expected page');
    expect(h.title).toContain('숨은그림찾기 도안');
    expect(h.bodyHtml).toContain('호랑이');
    const w = renderActivitySeo('hangul', 'kr-h1-u02', catalog);
    if (!w || 'redirect' in w) throw new Error('expected page');
    expect(w.title).toContain('한글 학습지');
  });

  it('sibling links wrap within a big group so every page in it is linked from somewhere', () => {
    const many = Array.from({ length: 50 }, (_, i) => ({
      key: `bk-${String(i + 1).padStart(4, '0')}`,
      group: '자연 관찰',
      section: '자연',
      bookId: String(100 + i),
      bookTitle: `책${i + 1}`,
      word: `낱말${i + 1}`,
      lineartUrl: `/api/r2-proxy?key=${i}`,
    }));
    const big = buildCatalog(many, []);
    const link = (n: number) =>
      '/activity/coloring/' +
      encodeURIComponent(`bk-${String(n).padStart(4, '0')}-낱말${n}-책${n}`);

    const page45 = renderActivitySeo('coloring', `bk-0045-낱말45-책45`, big);
    if (!page45 || 'redirect' in page45) throw new Error('expected page');
    expect(page45.bodyHtml).toContain(link(46));
    expect(page45.bodyHtml).toContain(link(1)); // wraps past the end of the group

    const page1 = renderActivitySeo('coloring', `bk-0001-낱말1-책1`, big);
    if (!page1 || 'redirect' in page1) throw new Error('expected page');
    expect(page1.bodyHtml).toContain(link(2));
    expect(page1.bodyHtml).not.toContain(link(1)); // not just "first 40 starting from itself"
  });

  it('hub links every kind', () => {
    const hub = renderActivityHubSeo(catalog);
    expect(hub.bodyHtml).toContain('/activity/hangul/kr-h1-u01');
    expect(hub.bodyHtml).toContain('/activity/hidden-object/');
  });
});
