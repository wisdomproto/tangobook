import { describe, it, expect } from 'vitest';
import { resolveSeries, SERIES_RULES } from './series-registry.js';

describe('resolveSeries', () => {
  it('카테고리 문자열로 시리즈를 찾는다', () => {
    expect(resolveSeries('세계 명작')?.key).toBe('classic');
    expect(resolveSeries('생활동화')?.key).toBe('life');
    // 자연관찰 하위 카테고리 (실측 2026-07-16, /api/storybooks distinct)
    expect(resolveSeries('육지 동물 친구들')?.key).toBe('nature');
    expect(resolveSeries('공룡 친구들')?.key).toBe('nature');
    expect(resolveSeries('우리 몸 이야기')?.key).toBe('nature');
    // 저작도구 상수(STORYBOOK_CATEGORIES) 표기 혼용 대비
    expect(resolveSeries('전래 동화')?.key).toBe('folk');
    expect(resolveSeries('자연 관찰')?.key).toBe('nature');
  });

  it('모르는 카테고리는 null (미분류 노출용)', () => {
    expect(resolveSeries('없는카테고리')).toBeNull();
    expect(resolveSeries(undefined)).toBeNull();
    expect(resolveSeries(null)).toBeNull();
    expect(resolveSeries('')).toBeNull();
  });

  it('모든 규칙은 key/label/artStyleMode/reelPipeline 을 가진다', () => {
    for (const r of SERIES_RULES) {
      expect(r.key).toBeTruthy();
      expect(r.label).toBeTruthy();
      expect(['styles3', 'base']).toContain(r.artStyleMode);
      expect(['storyboard', 'nature', 'derive', 'none']).toContain(r.reelPipeline);
    }
  });

  it('카테고리는 시리즈 간 중복이 없다', () => {
    const all = SERIES_RULES.flatMap((r) => r.categories);
    expect(new Set(all).size).toBe(all.length);
  });
});
