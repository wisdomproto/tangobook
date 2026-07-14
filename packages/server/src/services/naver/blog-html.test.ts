import { describe, it, expect } from 'vitest';
import { buildInjectionPlan } from './blog-html.js';
import type { BlogPostV2 } from '@tangobook/shared';

const base: BlogPostV2 = {
  id: 'post1',
  language: 'ko',
  title: '제목',
  summary: 's',
  tags: ['태그1', '태그2'],
  sections: [
    {
      id: 's1',
      header: '소제목1',
      text: '본문1',
      imageUrl: 'https://r2/a.jpg',
      imageCaption: '캡션1',
    },
    { id: 's2', header: '소제목2', text: '본문2' },
  ],
  createdAt: '',
  updatedAt: '',
};

describe('buildInjectionPlan', () => {
  it('제목과 태그를 그대로 전달한다', () => {
    const plan = buildInjectionPlan(base);
    expect(plan.title).toBe('제목');
    expect(plan.tags).toEqual(['태그1', '태그2']);
  });

  it('섹션을 순서대로 블록으로 변환한다 (소제목→본문→이미지)', () => {
    const plan = buildInjectionPlan(base);
    // s1: header, text, image  /  s2: header, text
    expect(plan.blocks).toEqual([
      { kind: 'heading', text: '소제목1', sectionId: 's1' },
      { kind: 'text', text: '본문1', sectionId: 's1' },
      { kind: 'image', imageUrl: 'https://r2/a.jpg', caption: '캡션1', sectionId: 's1' },
      { kind: 'heading', text: '소제목2', sectionId: 's2' },
      { kind: 'text', text: '본문2', sectionId: 's2' },
    ]);
  });

  it('빈 header/text 는 블록을 생성하지 않는다', () => {
    const plan = buildInjectionPlan({
      ...base,
      sections: [{ id: 'x', header: '', text: '', imageUrl: 'https://r2/x.jpg' }],
    });
    expect(plan.blocks).toEqual([
      { kind: 'image', imageUrl: 'https://r2/x.jpg', caption: undefined, sectionId: 'x' },
    ]);
  });
});
