import { buildWalls, labelRegions, paintableRegions, borderRegions } from '@tangobook/shared';

/** Qwen 장면의 연한 선도 경계로 읽고, 가장 큰 테두리 여백만 완료 조건에서 제외한다.
 * 장면 인물의 옷/머리가 화면에서 잘린 경우에도 나머지 테두리 칸은 칠할 수 있어야 한다.
 * 큰 흰 여백을 가진 장면 도안을 전제로 하며, 인물과 배경이 연결된 열린 선은 별도 검수한다. */
export function buildSceneColoringRegions(
  pixels: Uint8ClampedArray,
  width: number,
  height: number
) {
  const walls = buildWalls(pixels, 192);
  const regions = labelRegions(walls, width, height);
  const borders = borderRegions(regions.labels, width, height);
  let background = 0;
  for (const id of borders)
    if (regions.sizes[id] > (regions.sizes[background] ?? 0)) background = id;
  const required = paintableRegions(
    regions,
    width * height,
    0.003,
    new Set(background ? [background] : [])
  );
  return { walls, regions, required };
}
