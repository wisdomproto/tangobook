import { describe, it, expect } from 'vitest';
import { buildWalls, labelRegions } from '@tangobook/shared';
import { boundsOf, buildPalette, cornerBackground } from './answer-colors';

/** 문자열 그림 → RGBA. '#'=검은 선, 그 외는 colors 맵의 색. */
function paint(rows: string[], colors: Record<string, [number, number, number]>) {
  const h = rows.length;
  const w = rows[0].length;
  const rgba = new Uint8ClampedArray(w * h * 4);
  rows.forEach((row, y) => {
    [...row].forEach((c, x) => {
      const o = (y * w + x) * 4;
      const [r, g, b] = c === '#' ? [0, 0, 0] : colors[c];
      rgba[o] = r;
      rgba[o + 1] = g;
      rgba[o + 2] = b;
      rgba[o + 3] = 255;
    });
  });
  return { rgba, w, h };
}

// 도안: 세로선이 좌/우를 가른다. 정답본: 왼쪽 노랑, 오른쪽 주황.
const LINE = ['..#..', '..#..', '..#..'];
const ANSWER = ['YY#OO', 'YY#OO', 'YY#OO'];
const COLORS: Record<string, [number, number, number]> = {
  Y: [240, 208, 80],
  O: [240, 144, 48],
  '.': [255, 255, 255],
};

function setup(lineRows = LINE, answerRows = ANSWER) {
  const line = paint(lineRows, { '.': [255, 255, 255] });
  const ans = paint(answerRows, COLORS);
  const regions = labelRegions(buildWalls(line.rgba), line.w, line.h);
  const ids = Array.from({ length: regions.sizes.length - 1 }, (_, i) => i + 1);
  return { regions, ids, ...buildPalette(regions, ans.rgba, ids) };
}

describe('answer-colors', () => {
  it('칸마다 정답본의 색을 읽어 물감을 만든다', () => {
    const { palette, colorOfRegion, regions } = setup();
    expect(palette.map((p) => p.color).sort()).toEqual(['#f09030', '#f0d050']);
    // 왼쪽 칸(라벨 1)은 노랑, 오른쪽 칸은 주황 — 서로 다른 물감.
    const left = colorOfRegion.get(1);
    const right = colorOfRegion.get(regions.sizes.length - 1);
    expect(left).toBe('#f0d050');
    expect(right).toBe('#f09030');
  });

  it('넓은 색이 팔레트 앞에 온다', () => {
    // 왼쪽 칸을 넓게: 노랑 8칸 vs 주황 4칸. 🔴 도안과 정답본은 폭이 같아야 한다.
    const { palette } = setup(['....#..', '....#..'], ['YYYY#OO', 'YYYY#OO']);
    expect(palette[0].color).toBe('#f0d050');
    expect(palette[0].area).toBeGreaterThan(palette[1].area);
  });

  it('🔴 칸 가장자리에 걸친 검은 선이 색을 어둡게 끌어내리지 않는다', () => {
    // 노랑 칸의 절반이 정답본에선 검게 찍힌 극단 사례. 평균이면 겨자색(≈120)이 된다.
    const line = paint(['....', '....'], { '.': [255, 255, 255] });
    const ans = paint(['YY##', 'YY##'], COLORS);
    const regions = labelRegions(buildWalls(line.rgba), line.w, line.h);
    const { palette } = buildPalette(regions, ans.rgba, [1]);
    expect(palette[0].color).toBe('#f0d050'); // 최빈 무리(노랑)의 평균 그대로
  });

  it('아이 눈에 같은 색은 물감 하나로 묶는다', () => {
    // 미세하게 다른 두 노랑(Δ<40) → 물감 1개.
    const line = paint(['..#..'], { '.': [255, 255, 255] });
    const ans = paint(['YY#Zz'.slice(0, 5)], {
      ...COLORS,
      Y: [240, 208, 80],
      Z: [235, 205, 78],
      z: [235, 205, 78],
    });
    const regions = labelRegions(buildWalls(line.rgba), line.w, line.h);
    const ids = Array.from({ length: regions.sizes.length - 1 }, (_, i) => i + 1);
    const { palette } = buildPalette(regions, ans.rgba, ids);
    expect(palette.length).toBe(1);
    expect(palette[0].regionIds.length).toBe(2);
  });
});

/**
 * 🔴 도안은 원본을 **다시 그린** 그림이라 자리가 어긋난다 — 칸에 배경이 가장 많이 걸리면
 *    「흰 고양이」가 나온다. 배경색을 주면 두 번째로 많은 색을 대신 읽어야 한다.
 */
describe('배경색에서 색을 읽지 않는다', () => {
  // 한 칸(왼쪽) 안에 배경 크림 6칸 + 주황 4칸 — 최빈색은 크림이다.
  const LINE_ONE = ['..#', '..#', '..#', '..#', '..#'];
  const SRC = ['CC#', 'CC#', 'OC#', 'OO#', 'OO#'];
  const PALETTE_COLORS: Record<string, [number, number, number]> = {
    C: [250, 246, 238],
    O: [230, 130, 40],
    '#': [0, 0, 0],
  };
  const CREAM = [250, 246, 238];

  function run(background?: number[]) {
    const line = paint(LINE_ONE, { '.': [255, 255, 255] });
    const src = paint(SRC, PALETTE_COLORS);
    const regions = labelRegions(buildWalls(line.rgba), line.w, line.h);
    return buildPalette(regions, src.rgba, [1], background);
  }

  it('배경색을 안 주면 크림(최빈색)을 그대로 읽는다', () => {
    expect(run().colorOfRegion.get(1)).toBe('#faf6ee');
  });

  it('배경색을 주면 주황을 읽는다', () => {
    expect(run(CREAM).colorOfRegion.get(1)).toBe('#e68228');
  });

  it('칸이 정말 배경색뿐이면 그대로 둔다 — 하얀 백조는 하얗다', () => {
    const line = paint(['.#', '.#'], { '.': [255, 255, 255] });
    const src = paint(['CC', 'CC'], PALETTE_COLORS);
    const regions = labelRegions(buildWalls(line.rgba), line.w, line.h);
    expect(buildPalette(regions, src.rgba, [1], CREAM).colorOfRegion.get(1)).toBe('#faf6ee');
  });
});

describe('배경색과 그림 사각형', () => {
  it('네 귀퉁이 평균이 배경색이다', () => {
    const { rgba, w, h } = paint(['CCC', 'COC', 'CCC'], {
      C: [250, 246, 238],
      O: [230, 130, 40],
    });
    expect(cornerBackground(rgba, w, h).map(Math.round)).toEqual([250, 246, 238]);
  });

  it('그림이 차지한 사각형만 집는다', () => {
    // 5x4 중 (1,1)~(3,2)만 참
    const hit = (i: number) => {
      const x = i % 5;
      const y = Math.floor(i / 5);
      return x >= 1 && x <= 3 && y >= 1 && y <= 2;
    };
    expect(boundsOf(5, 4, hit)).toEqual({ x: 1, y: 1, w: 3, h: 2 });
  });

  it('하나도 없으면 화면 전체다', () => {
    expect(boundsOf(4, 3, () => false)).toEqual({ x: 0, y: 0, w: 4, h: 3 });
  });
});
