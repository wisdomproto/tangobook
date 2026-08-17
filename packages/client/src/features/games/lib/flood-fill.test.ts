/**
 * 🔴 코드는 `packages/shared/src/utils/flood-fill.ts` 에 있는데 테스트는 여기 있다.
 *    `packages/shared` 에는 test 스크립트가 없고 client·server 의 vitest `include` 가 각자
 *    자기 `src/` 만 보므로, **shared 로 옮기면 이 가드가 조용히 안 돌게 된다**(옮겼다가 되돌렸다).
 */
import { describe, it, expect } from 'vitest';
import { buildWalls, labelRegions, paintableRegions, borderRegions } from '@tangobook/shared';

/** 문자열 그림 → RGBA. '#' = 검은 선, '.' = 흰 면. */
function toRgba(rows: string[]): { rgba: Uint8ClampedArray; w: number; h: number } {
  const h = rows.length;
  const w = rows[0].length;
  const rgba = new Uint8ClampedArray(w * h * 4);
  rows.forEach((row, y) => {
    [...row].forEach((c, x) => {
      const o = (y * w + x) * 4;
      const v = c === '#' ? 0 : 255;
      rgba[o] = rgba[o + 1] = rgba[o + 2] = v;
      rgba[o + 3] = 255;
    });
  });
  return { rgba, w, h };
}

function label(rows: string[]) {
  const { rgba, w, h } = toRgba(rows);
  return { ...labelRegions(buildWalls(rgba), w, h), w, h };
}

describe('flood-fill', () => {
  it('선으로 갈린 두 면을 다른 칸으로 나눈다', () => {
    // 가운데 세로선이 좌/우를 가른다.
    const { labels, sizes, w } = label(['..#..', '..#..', '..#..']);
    expect(sizes.length - 1).toBe(2); // 칸 2개
    expect(labels[0]).not.toBe(labels[4]); // 왼쪽 끝 ≠ 오른쪽 끝
    expect(labels[0]).toBe(labels[w * 2]); // 왼쪽 위 = 왼쪽 아래 (같은 칸)
    expect(sizes[labels[0]]).toBe(6);
  });

  it('🔴 선이 한 칸이라도 끊기면 물감이 새어 한 칸이 된다', () => {
    // 위와 같은 그림인데 가운데 줄의 선이 빠졌다.
    const { labels, sizes } = label(['..#..', '.....', '..#..']);
    expect(sizes.length - 1).toBe(1);
    expect(labels[0]).toBe(labels[4]);
  });

  it('닫힌 고리 안쪽은 바깥과 다른 칸이다', () => {
    const { labels, sizes, w } = label(['#####', '#...#', '#...#', '#####']);
    // 벽으로만 둘러싸여 바깥 흰 면이 없다 → 칸은 안쪽 하나.
    expect(sizes.length - 1).toBe(1);
    expect(labels[0]).toBe(0); // 벽
    expect(labels[w + 1]).toBe(1);
    expect(sizes[1]).toBe(6);
  });

  it('벽은 칸에 안 들어간다', () => {
    const { labels } = label(['#.#']);
    expect(labels[0]).toBe(0);
    expect(labels[2]).toBe(0);
    expect(labels[1]).toBe(1);
  });

  it('paintableRegions 는 눈에 안 보이는 티끌 칸을 뺀다', () => {
    // 왼쪽 큰 칸(6px) + 오른쪽 티끌 칸(1px).
    const { sizes, w, h } = label(['...#.', '...##', '...#.']);
    const total = w * h;
    const big = paintableRegions({ labels: new Int32Array(0), sizes }, total, 0.1);
    expect(big.length).toBe(1);
    expect(sizes[big[0]]).toBeGreaterThan(1);
  });

  it('🔴 바깥 여백은 「다 칠했다」 조건에서 빠진다', () => {
    // 가운데 닫힌 동그라미 하나 + 그 바깥 여백.
    const { labels, sizes, w, h } = label(['.....', '.###.', '.#.#.', '.###.', '.....']);
    const outside = borderRegions(labels, w, h);
    expect(outside.size).toBe(1);

    // 여백이 가장 큰 칸이라 크기 기준만으로는 절대 안 걸러진다 — 그래서 제외 목록이 필요하다.
    const outsideId = [...outside][0];
    expect(sizes[outsideId]).toBe(Math.max(...sizes.slice(1)));

    const required = paintableRegions({ labels, sizes }, w * h, 0, outside);
    expect(required).toEqual(
      [...Array(sizes.length - 1).keys()].map((i) => i + 1).filter((id) => id !== outsideId)
    );
  });
});
