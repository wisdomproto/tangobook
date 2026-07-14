import { describe, it, expect } from 'vitest';
import { buildInjectionPlan, type BlogSource } from './blog-html.js';

const base: BlogSource = {
  blogContentId: 'blog1',
  bookId: 'book1',
  title: '캥거루 특징과 주머니 육아의 비밀',
  tags: ['캥거루', '캥거루 특징', '유대류'],
  cards: [
    {
      id: 'c0',
      html: '<h2>캥거루</h2><p>주머니 동물</p>',
      imageUrl: 'https://r2/cover.webp',
      caption: '주머니 동물',
    },
    { id: 'c1', html: '<h2>자연·과학</h2><p>유대류예요</p>' },
  ],
};

describe('buildInjectionPlan (Supabase mkt blog source)', () => {
  it('제목과 태그를 그대로 전달한다', () => {
    const plan = buildInjectionPlan(base);
    expect(plan.title).toBe('캥거루 특징과 주머니 육아의 비밀');
    expect(plan.tags).toEqual(['캥거루', '캥거루 특징', '유대류']);
  });

  it('카드를 순서대로 블록으로 변환한다 (HTML→이미지)', () => {
    const plan = buildInjectionPlan(base);
    // c0: html + image  /  c1: html only
    expect(plan.blocks).toEqual([
      { kind: 'html', html: '<h2>캥거루</h2><p>주머니 동물</p>', sectionId: 'c0' },
      { kind: 'image', imageUrl: 'https://r2/cover.webp', caption: '주머니 동물', sectionId: 'c0' },
      { kind: 'html', html: '<h2>자연·과학</h2><p>유대류예요</p>', sectionId: 'c1' },
    ]);
  });

  it('빈 html·이미지 없는 카드는 블록을 만들지 않는다', () => {
    const plan = buildInjectionPlan({ ...base, cards: [{ id: 'x', html: '   ' }] });
    expect(plan.blocks).toEqual([]);
  });

  it('이미지만 있고 html 이 비면 이미지 블록만 만든다', () => {
    const plan = buildInjectionPlan({
      ...base,
      cards: [{ id: 'y', html: '', imageUrl: 'https://r2/y.webp' }],
    });
    expect(plan.blocks).toEqual([
      { kind: 'image', imageUrl: 'https://r2/y.webp', caption: undefined, sectionId: 'y' },
    ]);
  });
});
