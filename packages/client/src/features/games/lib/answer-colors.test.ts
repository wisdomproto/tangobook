import { describe, it, expect } from 'vitest';
import { buildWalls, labelRegions } from '@tangobook/shared';
import { buildPalette } from './answer-colors';

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
