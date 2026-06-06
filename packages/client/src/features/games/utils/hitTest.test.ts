import { describe, it, expect } from 'vitest';
import { toImageNorm, hitNormalizedBox } from './hitTest';
import type { HiddenObjectTarget } from '@tangobook/shared';

const container = { width: 800, height: 600 };
const imageAspect = 16 / 9;

describe('toImageNorm (object-fit: contain)', () => {
  it('레터박스 안의 탭을 0~1 정규화 좌표로 변환한다', () => {
    const p = toImageNorm(400, 300, container, imageAspect);
    expect(p).not.toBeNull();
    expect(p!.x).toBeCloseTo(0.5, 5);
    expect(p!.y).toBeCloseTo(0.5, 5);
  });

  it('레터박스(여백) 위의 탭은 null 을 반환한다', () => {
    const p = toImageNorm(400, 10, container, imageAspect);
    expect(p).toBeNull();
  });

  it('이미지 좌상단 모서리는 (0,0) 근처', () => {
    const p = toImageNorm(0, 75, container, imageAspect);
    expect(p!.x).toBeCloseTo(0, 5);
    expect(p!.y).toBeCloseTo(0, 5);
  });
});

describe('hitNormalizedBox', () => {
  const target = { x: 0.4, y: 0.4, w: 0.2, h: 0.2 } as HiddenObjectTarget;

  it('박스 안의 점은 적중', () => {
    expect(hitNormalizedBox({ x: 0.5, y: 0.5 }, target)).toBe(true);
  });
  it('박스 밖의 점은 미적중', () => {
    expect(hitNormalizedBox({ x: 0.1, y: 0.1 }, target)).toBe(false);
  });
  it('경계선 위(좌상단 꼭짓점)는 적중', () => {
    expect(hitNormalizedBox({ x: 0.4, y: 0.4 }, target)).toBe(true);
  });
});
