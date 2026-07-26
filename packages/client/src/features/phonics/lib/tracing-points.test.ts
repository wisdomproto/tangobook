import { describe, it, expect } from 'vitest';
import { flashcardDots, toKeypoints } from './tracing-points';

describe('flashcardDots', () => {
  it('keypoints 를 order 순으로 편다', () => {
    expect(
      flashcardDots({
        keypoints: [
          { x: 0.3, y: 0.3, order: 2 },
          { x: 0.1, y: 0.1, order: 1 },
        ],
      })
    ).toEqual([
      { x: 0.1, y: 0.1 },
      { x: 0.3, y: 0.3 },
    ]);
  });

  it('keypoints 가 없으면 옛 tracingPoints 로 폴백', () => {
    const tracingPoints = [{ x: 0.2, y: 0.4 }];
    expect(flashcardDots({ tracingPoints })).toEqual(tracingPoints);
  });

  it('둘 다 없으면 빈 배열', () => {
    expect(flashcardDots({})).toEqual([]);
  });
});

describe('toKeypoints', () => {
  it('그린 순서를 order 1..N 으로 매긴다', () => {
    expect(
      toKeypoints([
        { x: 0.1, y: 0.2 },
        { x: 0.3, y: 0.4 },
      ])
    ).toEqual([
      { x: 0.1, y: 0.2, order: 1 },
      { x: 0.3, y: 0.4, order: 2 },
    ]);
  });
});
