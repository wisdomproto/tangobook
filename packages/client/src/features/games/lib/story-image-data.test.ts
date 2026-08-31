import { describe, it, expect } from 'vitest';
import type { Storybook } from '@tangobook/shared';
import { buildStoryImageData } from './story-image-data';

function page(n: number, extra: Record<string, unknown> = {}) {
  return {
    pageNumber: n,
    text: `${n}쪽 본문`,
    ttsUrl: `https://cdn/ko-${n}.mp3`,
    illustrationUrl: `https://cdn/p${n}.webp`,
    ...extra,
  };
}

function book(pages: unknown[], extra: Record<string, unknown> = {}): Storybook {
  return { id: 'b1', title: '테스트', pages, ...extra } as unknown as Storybook;
}

describe('buildStoryImageData', () => {
  it('ko: 쪽에서 라운드를 만들고 오답은 정답과 겹치지 않는다', () => {
    const data = buildStoryImageData(book([page(1), page(2), page(3), page(4)]), 'ko');
    expect(data?.type).toBe('korean-story-image');
    expect(data?.rounds).toHaveLength(4);
    for (const r of data!.rounds) {
      expect(r.distractorImageUrls).toHaveLength(2);
      expect(r.distractorImageUrls).not.toContain(r.correctImageUrl);
      expect(r.ttsUrl).toBeTruthy();
    }
  });

  it('쓸 수 있는 쪽이 3개 미만이면 null (오답 2개를 못 뽑는다)', () => {
    expect(buildStoryImageData(book([page(1), page(2)]), 'ko')).toBeNull();
    expect(buildStoryImageData(undefined, 'ko')).toBeNull();
  });

  it('나레이션·삽화 없는 쪽은 버린다', () => {
    const pages = [
      page(1),
      page(2, { ttsUrl: undefined }),
      page(3, { illustrationUrl: '' }),
      page(4),
    ];
    expect(buildStoryImageData(book(pages), 'ko')).toBeNull(); // 남는 건 2쪽
  });

  it('비-ko: 그 언어 번역이 없으면 한국어 base 로 대신하지 않는다', () => {
    const withVi = (n: number) =>
      page(n, { translations: { vi: { text: `trang ${n}`, ttsUrl: `https://cdn/vi-${n}.mp3` } } });
    expect(buildStoryImageData(book([page(1), page(2), page(3)]), 'vi')).toBeNull();
    const data = buildStoryImageData(book([withVi(1), withVi(2), withVi(3)]), 'vi');
    expect(data?.type).toBe('english-story-image');
    expect(data?.rounds[0].text).toMatch(/^trang /);
  });

  it('그림체가 있으면 그 그림체의 쪽 삽화를 쓴다', () => {
    const styled = book([page(1), page(2), page(3)], {
      styleAssets: {
        collage: {
          pageIllustrations: {
            1: { illustrationUrl: 'https://cdn/collage1.webp' },
            2: { illustrationUrl: 'https://cdn/collage2.webp' },
            3: { illustrationUrl: 'https://cdn/collage3.webp' },
          },
        },
      },
    });
    const data = buildStoryImageData(styled, 'ko', 'collage');
    const urls = data!.rounds.flatMap((r) => [r.correctImageUrl, ...r.distractorImageUrls]);
    expect(urls.every((u) => u.includes('collage'))).toBe(true);
  });
});
