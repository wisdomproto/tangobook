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
  regionIds: number[]
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

  const rgbOfRegion = new Map<number, number[]>();
  for (const id of regionIds) {
    let best: number[] | null = null;
    for (const acc of (hist.get(id) as Map<number, number[]>).values()) {
      if (!best || acc[0] > best[0]) best = acc;
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
