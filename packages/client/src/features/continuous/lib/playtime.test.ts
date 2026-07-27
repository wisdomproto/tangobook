import { describe, it, expect } from 'vitest';
import { estimatePlaySeconds, playtimeParts, SECONDS_PER_BOOK } from './playtime';

describe('estimatePlaySeconds', () => {
  it('권수에 비례한다', () => {
    expect(estimatePlaySeconds(0)).toBe(0);
    expect(estimatePlaySeconds(3)).toBe(3 * SECONDS_PER_BOOK);
  });

  it('음수는 0', () => {
    expect(estimatePlaySeconds(-2)).toBe(0);
  });
});

describe('playtimeParts', () => {
  it('5분 단위로 끊는다 — 없는 정밀도를 주장하지 않는다', () => {
    expect(playtimeParts(62 * 60)).toEqual({ hours: 1, minutes: 0 });
    expect(playtimeParts(63 * 60)).toEqual({ hours: 1, minutes: 5 });
  });

  it('한 시간 미만은 분만', () => {
    expect(playtimeParts(9 * 60)).toEqual({ hours: 0, minutes: 10 });
  });

  it('아주 짧아도 0분으로 내리지 않는다', () => {
    expect(playtimeParts(30)).toEqual({ hours: 0, minutes: 5 });
  });

  it('명작 48권 ≈ 2시간 35분', () => {
    expect(playtimeParts(estimatePlaySeconds(48))).toEqual({ hours: 2, minutes: 35 });
  });
});
