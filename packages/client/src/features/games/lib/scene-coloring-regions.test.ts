import { describe, expect, it } from 'vitest';
import { buildSceneColoringRegions } from './scene-coloring-regions';

function image(w: number, h: number, dark: (x: number, y: number) => boolean) {
  const pixels = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const offset = (y * w + x) * 4;
      pixels.fill(dark(x, y) ? 160 : 255, offset, offset + 3);
      pixels[offset + 3] = 255;
    }
  return pixels;
}

describe('장면 색칠 영역', () => {
  it('작은 목끈은 기본 완료 조건에서 빼되 해당 장면의 명시 검수값으로 포함한다', () => {
    const pixels = image(
      200,
      200,
      (x, y) =>
        ((x === 50 || x === 180) && y >= 50 && y <= 180) ||
        ((y === 50 || y === 180) && x >= 50 && x <= 180) ||
        ((x === 60 || x === 72) && y >= 60 && y <= 70) ||
        ((y === 60 || y === 70) && x >= 60 && x <= 72)
    );
    const ordinary = buildSceneColoringRegions(pixels, 200, 200);
    const reviewed = buildSceneColoringRegions(pixels, 200, 200, 0.001);
    const band = reviewed.regions.labels[65 * 200 + 65];
    expect(ordinary.required).not.toContain(band);
    expect(reviewed.required).toContain(band);
    expect(reviewed.required).not.toContain(reviewed.regions.labels[0]);
  });
  it('연한 회색 윤곽으로 둘러싸인 인물을 칠할 수 있다', () => {
    const pixels = image(
      20,
      20,
      (x, y) =>
        ((x === 5 || x === 12) && y >= 5 && y <= 12) || ((y === 5 || y === 12) && x >= 5 && x <= 12)
    );
    const result = buildSceneColoringRegions(pixels, 20, 20);
    expect(result.required).toEqual([result.regions.labels[6 * 20 + 6]]);
    expect(result.required).not.toContain(result.regions.labels[0]);
  });

  it('화면 아래에서 잘린 옷도 칠하되 큰 바깥 여백은 제외한다', () => {
    const pixels = image(
      20,
      20,
      (x, y) => ((x === 5 || x === 12) && y >= 5) || (y === 5 && x >= 5 && x <= 12)
    );
    const result = buildSceneColoringRegions(pixels, 20, 20);
    expect(result.required).toContain(result.regions.labels[19 * 20 + 6]);
    expect(result.required).not.toContain(result.regions.labels[0]);
  });

  it('윤곽이 열린 그림을 완료 가능한 도안으로 오인하지 않는다', () => {
    const result = buildSceneColoringRegions(
      image(20, 20, () => false),
      20,
      20
    );
    expect(result.required).toEqual([]);
  });
});
