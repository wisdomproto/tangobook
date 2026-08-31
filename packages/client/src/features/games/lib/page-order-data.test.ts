import { describe, it, expect } from 'vitest';
import type { Storybook } from '@tangobook/shared';
import { buildPageOrderData } from './page-order-data';

const book = (n: number, extra: Record<string, unknown> = {}): Storybook =>
  ({
    id: 'b1',
    pages: Array.from({ length: n }, (_, i) => ({
      pageNumber: i + 1,
      illustrationUrl: `https://cdn/p${i + 1}.webp`,
    })),
    ...extra,
  }) as unknown as Storybook;

describe('buildPageOrderData', () => {
  it('정답 순서(쪽 번호 오름차순)로 4장을 담는다', () => {
    const d = buildPageOrderData(book(13));
    expect(d?.items.map((i) => i.pageNumber)).toEqual([1, 5, 9, 13]);
  });

  it('이웃한 쪽을 고르지 않는다 — 처음·중간·끝이 고루 섞인다', () => {
    for (const n of [4, 7, 10, 15, 16]) {
      const nums = buildPageOrderData(book(n))!.items.map((i) => i.pageNumber);
      expect(nums).toHaveLength(4);
      expect([...nums]).toEqual([...nums].sort((a, b) => a - b));
      expect(new Set(nums).size).toBe(4);
      expect(nums[0]).toBe(1);
      expect(nums[3]).toBe(n);
    }
  });

  it('삽화 있는 쪽이 4개 미만이면 null', () => {
    expect(buildPageOrderData(book(3))).toBeNull();
    expect(buildPageOrderData(undefined)).toBeNull();
    const holes = book(6);
    holes.pages.slice(0, 3).forEach((p) => (p.illustrationUrl = ''));
    expect(buildPageOrderData(holes)).toBeNull();
  });

  it('그림체가 있으면 그 그림체의 쪽 삽화를 쓴다', () => {
    const styled = book(4, {
      styleAssets: {
        collage: {
          pageIllustrations: Object.fromEntries(
            [1, 2, 3, 4].map((n) => [n, { illustrationUrl: `https://cdn/collage${n}.webp` }])
          ),
        },
      },
    });
    const d = buildPageOrderData(styled, 'collage');
    expect(d!.items.every((i) => i.illustrationUrl.includes('collage'))).toBe(true);
  });
});
