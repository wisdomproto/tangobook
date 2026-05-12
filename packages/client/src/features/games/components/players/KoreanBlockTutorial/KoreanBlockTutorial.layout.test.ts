import { describe, it, expect } from 'vitest';
import { planTutorialLayout } from './KoreanBlockTutorial.layout';

describe('planTutorialLayout', () => {
  it('가 — 수평 모음 1음절', () => {
    expect(planTutorialLayout('가')).toEqual([
      { cho: 'ㄱ', jung: 'ㅏ', choCell: [1, 0], jungCell: [1, 1], isVertical: false },
    ]);
  });

  it('구 — 수직 모음 1음절', () => {
    expect(planTutorialLayout('구')).toEqual([
      { cho: 'ㄱ', jung: 'ㅜ', choCell: [1, 0], jungCell: [2, 0], isVertical: true },
    ]);
  });

  it('나무 — 수평 + 수직', () => {
    expect(planTutorialLayout('나무')).toEqual([
      { cho: 'ㄴ', jung: 'ㅏ', choCell: [1, 0], jungCell: [1, 1], isVertical: false },
      { cho: 'ㅁ', jung: 'ㅜ', choCell: [1, 2], jungCell: [2, 2], isVertical: true },
    ]);
  });

  it('구두 — 수직 2음절', () => {
    expect(planTutorialLayout('구두')).toEqual([
      { cho: 'ㄱ', jung: 'ㅜ', choCell: [1, 0], jungCell: [2, 0], isVertical: true },
      { cho: 'ㄷ', jung: 'ㅜ', choCell: [1, 1], jungCell: [2, 1], isVertical: true },
    ]);
  });

  it('토끼 — 수직 + 수평', () => {
    expect(planTutorialLayout('토끼')).toEqual([
      { cho: 'ㅌ', jung: 'ㅗ', choCell: [1, 0], jungCell: [2, 0], isVertical: true },
      { cho: 'ㄲ', jung: 'ㅣ', choCell: [1, 1], jungCell: [1, 2], isVertical: false },
    ]);
  });

  it('빈 문자열 — 빈 배열', () => {
    expect(planTutorialLayout('')).toEqual([]);
  });
});
