import { describe, it, expect } from 'vitest';
import { summarizeFormats, type OwnVideoRow } from '../external/youtube-own-analytics.js';

function row(p: Partial<OwnVideoRow>): OwnVideoRow {
  return {
    id: 'x',
    title: 't',
    seconds: 180,
    isShort: false,
    views: 0,
    avgViewDuration: 0,
    avgViewPercentage: 0,
    minutes: 0,
    subscribersGained: 0,
    ...p,
  };
}

describe('summarizeFormats', () => {
  it('조회수로 가중한다 — 조회 1회 영상이 결과를 흔들지 않아야 한다', () => {
    // 실측 함정: 알라딘(조회 13, 지속률 60%) 같은 소표본이 단순 평균이면 결론을 뒤집는다.
    const videos = [
      row({ views: 168, avgViewPercentage: 22.5, avgViewDuration: 47 }),
      row({ views: 13, avgViewPercentage: 60.2, avgViewDuration: 98 }),
    ];
    const [longform] = summarizeFormats(videos);
    expect(longform.views).toBe(181);
    // 단순 평균이면 41.35% — 가중이면 25.2%
    expect(longform.weightedAvgViewPercentage).toBeCloseTo((22.5 * 168 + 60.2 * 13) / 181, 5);
    expect(longform.weightedAvgViewPercentage).toBeLessThan(30);
  });

  it('롱폼과 쇼츠를 분리한다', () => {
    const out = summarizeFormats([
      row({ isShort: false, views: 10, avgViewPercentage: 30 }),
      row({ isShort: true, seconds: 33, views: 100, avgViewPercentage: 43 }),
    ]);
    expect(out.map((f) => f.label)).toEqual(['longform', 'shorts']);
    expect(out[1].views).toBe(100);
  });

  it('조회 0 그룹에서 0으로 나누지 않는다', () => {
    const [longform] = summarizeFormats([row({ views: 0, avgViewPercentage: 50 })]);
    expect(longform.weightedAvgViewPercentage).toBe(0);
    expect(Number.isNaN(longform.weightedAvgViewDuration)).toBe(false);
  });

  it('한쪽 포맷이 없으면 그 그룹을 만들지 않는다', () => {
    expect(summarizeFormats([row({ isShort: false, views: 5 })]).map((f) => f.label)).toEqual([
      'longform',
    ]);
    expect(summarizeFormats([])).toEqual([]);
  });
});
