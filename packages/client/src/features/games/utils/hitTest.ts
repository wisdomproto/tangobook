import type { HiddenObjectTarget } from '@tangobook/shared';

export interface NormPoint {
  x: number;
  y: number;
}

/**
 * object-fit: contain 으로 렌더된 이미지 위의 컨테이너 픽셀 좌표(px,py)를
 * 이미지 정규화 좌표(0~1)로 변환. 레터박스(여백) 위면 null.
 */
export function toImageNorm(
  px: number,
  py: number,
  container: { width: number; height: number },
  imageAspect: number
): NormPoint | null {
  const containerAspect = container.width / container.height;
  let renderW: number;
  let renderH: number;
  if (imageAspect > containerAspect) {
    renderW = container.width;
    renderH = container.width / imageAspect;
  } else {
    renderH = container.height;
    renderW = container.height * imageAspect;
  }
  const offsetX = (container.width - renderW) / 2;
  const offsetY = (container.height - renderH) / 2;

  const ix = px - offsetX;
  const iy = py - offsetY;
  if (ix < 0 || iy < 0 || ix > renderW || iy > renderH) return null;

  return { x: ix / renderW, y: iy / renderH };
}

/** 정규화 점이 타깃 박스 안(경계 포함)에 있는지. */
export function hitNormalizedBox(
  p: NormPoint,
  box: Pick<HiddenObjectTarget, 'x' | 'y' | 'w' | 'h'>
): boolean {
  return p.x >= box.x && p.x <= box.x + box.w && p.y >= box.y && p.y <= box.y + box.h;
}
