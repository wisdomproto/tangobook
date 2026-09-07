import type { Regions } from '@tangobook/shared';

/**
 * 색칠공부 — 칸마다 "무슨 색이 맞는지"를 정답본에서 읽는다.
 *
 * 🔴 정답색을 오프라인에서 미리 뽑아 두지 않는다. 칸 나누기(`labelRegions`)는 앱이 하는데
 *    정답색만 스크립트가 뽑으면 **같은 계산이 두 벌**이 되고, 도안이 바뀔 때 한쪽만 낡는다.
 *    정답본 이미지 한 장(≈50KB)을 더 받아 앱이 그 자리에서 읽으면 계산이 한 벌로 끝난다.
 */

export interface PaletteEntry {
  /** `#rrggbb` — 팔레트에 뜨는 물감. */
  color: string;
  /** 이 색으로 칠해야 하는 칸들. */
  regionIds: number[];
  /** 칸 넓이 합 — 큰 색부터 내주려고(아이는 큰 면부터 칠하는 게 쉽다). */
  area: number;
}

const BUCKET = 5; // 채널당 32단계로 뭉개 최빈색을 찾는다 (안티에일리어싱 흔들림 흡수)
/** 배경색으로 칠 거리 — 이만큼 안이면 "그냥 배경"이다. */
const BG_TOL = 26;
/** 배경 대신 쓸 색이 칸에서 차지해야 할 최소 몫. 이보다 작으면 삐져나온 티끌이다. */
const ALT_SHARE = 0.15;

/** 그림의 배경색 — 네 귀퉁이 평균. 낱말 카드·삽화는 크림/흰 무지 배경이다. */
export function cornerBackground(rgba: Uint8ClampedArray, w: number, h: number): number[] {
  const at = (x: number, y: number): number[] => {
    const o = (y * w + x) * 4;
    return [rgba[o], rgba[o + 1], rgba[o + 2]];
  };
  const corners = [at(2, 2), at(w - 3, 2), at(2, h - 3), at(w - 3, h - 3)];
  return [0, 1, 2].map((c) => corners.reduce((a, p) => a + p[c], 0) / 4);
}

/** `hit` 이 참인 픽셀이 차지한 사각형. 하나도 없으면 화면 전체. */
export function boundsOf(
  w: number,
  h: number,
  hit: (i: number) => boolean
): { x: number; y: number; w: number; h: number } {
  let x0 = w,
    y0 = h,
    x1 = -1,
    y1 = -1;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (!hit(y * w + x)) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  return x1 < 0 ? { x: 0, y: 0, w, h } : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

/** 두 색이 아이 눈에 같은 색인가 — 팔레트에 비슷한 물감이 두 개 뜨는 걸 막는다. */
function near(a: number[], b: number[], tol = 40): boolean {
  return Math.abs(a[0] - b[0]) < tol && Math.abs(a[1] - b[1]) < tol && Math.abs(a[2] - b[2]) < tol;
}

function hex([r, g, b]: number[]): string {
  return '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
}

/**
 * 칸별 정답색 → 팔레트.
 *
 * 한 칸의 색은 **최빈 색 무리의 평균**으로 잡는다. 평균만 쓰면 칸 가장자리에 걸친 검은 선이
 * 색을 통째로 어둡게 끌어내리고(노랑 오리가 겨자색이 된다), 최빈값만 쓰면 32단계로 뭉갠
 * 값이라 실제 색과 최대 16씩 어긋난다.
 */
export function buildPalette(
  regions: Regions,
  answerRgba: Uint8ClampedArray,
  regionIds: number[],
  /**
   * 색 출처의 배경색. 주면 **배경색이 1등인 칸은 배경이 아닌 색으로 바꿔 읽는다.**
   *
   * 🔴 도안은 원본을 **다시 그린** 그림이라 크기·자세가 안 맞는다. 겹치는 자리가 어긋나면
   *    고양이 몸통 칸에 원본의 흰 배경이 가장 많이 걸려 **흰 고양이**가 나온다(실측: 표본
   *    200장 중 81장이 칸 절반 이상을 배경색으로 읽었다). 배경을 빼면 그 자리에서 두 번째로
   *    많은 색 — 주황 털 — 이 올라온다. 하얀 백조처럼 진짜 배경색인 것은 대신 쓸 색이
   *    `ALT_SHARE` 를 못 넘어 그대로 남는다.
   */
  background?: readonly number[]
): { palette: PaletteEntry[]; colorOfRegion: Map<number, string> } {
  const wanted = new Set(regionIds);
  // regionId → bucket → [n, sumR, sumG, sumB]
  const hist = new Map<number, Map<number, number[]>>();
  for (const id of regionIds) hist.set(id, new Map());

  const { labels } = regions;
  for (let i = 0; i < labels.length; i++) {
    const id = labels[i];
    if (id === 0 || !wanted.has(id)) continue;
    const o = i * 4;
    const r = answerRgba[o];
    const g = answerRgba[o + 1];
    const b = answerRgba[o + 2];
    const key = ((r >> BUCKET) << 10) | ((g >> BUCKET) << 5) | (b >> BUCKET);
    const bins = hist.get(id) as Map<number, number[]>;
    const acc = bins.get(key);
    if (acc) {
      acc[0]++;
      acc[1] += r;
      acc[2] += g;
      acc[3] += b;
    } else {
      bins.set(key, [1, r, g, b]);
    }
  }

  const isBg = (acc: number[]): boolean =>
    background !== undefined &&
    near([acc[1] / acc[0], acc[2] / acc[0], acc[3] / acc[0]], background as number[], BG_TOL);

  const rgbOfRegion = new Map<number, number[]>();
  for (const id of regionIds) {
    const bins = [...(hist.get(id) as Map<number, number[]>).values()].sort((a, b) => b[0] - a[0]);
    const total = bins.reduce((n, acc) => n + acc[0], 0);
    let best = bins[0];
    if (best && isBg(best)) {
      const alt = bins.find((acc) => !isBg(acc) && acc[0] / total >= ALT_SHARE);
      if (alt) best = alt;
    }
    if (best) rgbOfRegion.set(id, [best[1] / best[0], best[2] / best[0], best[3] / best[0]]);
  }

  // 비슷한 색끼리 한 물감으로 묶기.
  const groups: { rgb: number[]; regionIds: number[]; area: number }[] = [];
  for (const id of regionIds) {
    const rgb = rgbOfRegion.get(id);
    if (!rgb) continue;
    const hit = groups.find((gr) => near(gr.rgb, rgb));
    if (hit) {
      hit.regionIds.push(id);
      hit.area += regions.sizes[id];
    } else {
      groups.push({ rgb, regionIds: [id], area: regions.sizes[id] });
    }
  }
  groups.sort((a, b) => b.area - a.area);

  const palette = groups.map((gr) => ({
    color: hex(gr.rgb),
    regionIds: gr.regionIds,
    area: gr.area,
  }));

  const colorOfRegion = new Map<number, string>();
  for (const entry of palette) for (const id of entry.regionIds) colorOfRegion.set(id, entry.color);

  return { palette, colorOfRegion };
}
