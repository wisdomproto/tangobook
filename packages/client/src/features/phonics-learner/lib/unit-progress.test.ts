import { describe, it, expect } from 'vitest';
import { progressPercent, sumProgress } from './unit-progress';

describe('progressPercent', () => {
  it('다 하기 전엔 100% 가 되지 않는다', () => {
    expect(progressPercent(199, 200)).toBe(99);
    expect(progressPercent(200, 200)).toBe(100);
  });

  it('시작했으면 0% 로 보이지 않는다', () => {
    expect(progressPercent(0, 200)).toBe(0);
    expect(progressPercent(1, 200)).toBe(1);
  });

  it('활동이 없는 단원은 0', () => {
    expect(progressPercent(0, 0)).toBe(0);
    expect(progressPercent(3, 0)).toBe(0);
  });
});

describe('sumProgress', () => {
  it('단원 수가 아니라 활동 수로 합산한다', () => {
    // 4개짜리를 다 한 단원 + 1개만 한 단원 = 5/8 (단원 기준이면 1/2 = 50% 가 됐을 것)
    expect(
      sumProgress([
        { done: 4, total: 4 },
        { done: 1, total: 4 },
      ])
    ).toEqual({
      done: 5,
      total: 8,
      percent: 63,
    });
  });

  it('빈 레벨은 0', () => {
    expect(sumProgress([])).toEqual({ done: 0, total: 0, percent: 0 });
  });
});
