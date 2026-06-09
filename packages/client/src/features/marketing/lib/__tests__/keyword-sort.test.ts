import { describe, it, expect } from 'vitest';
import {
  type KeywordItem,
  type SortState,
  colValue,
  toggleSort,
  sortIcon,
  sortKeywords,
} from '../keyword-sort';

const kw = (over: Partial<KeywordItem>): KeywordItem => ({
  keyword: 'k',
  category: 'c',
  priority: 'medium',
  searchIntent: 'informational',
  ...over,
});

describe('colValue (enum competition — R-1)', () => {
  it('maps competition by HIGH/MEDIUM/LOW (not Korean strings)', () => {
    expect(colValue(kw({ naverComp: 'HIGH' }), 'competition')).toBe(3);
    expect(colValue(kw({ naverComp: 'MEDIUM' }), 'competition')).toBe(2);
    expect(colValue(kw({ naverComp: 'LOW' }), 'competition')).toBe(1);
    expect(colValue(kw({ naverComp: '높음' as never }), 'competition')).toBe(0); // not enum ⇒ 0
  });
  it('numeric naver/google use ?? -1 for missing', () => {
    expect(colValue(kw({ naverMonthly: 4200 }), 'naver')).toBe(4200);
    expect(colValue(kw({}), 'naver')).toBe(-1);
    expect(colValue(kw({ googleVolume: 0 }), 'google')).toBe(0);
    expect(colValue(kw({}), 'google')).toBe(-1);
  });
  it('orders volume/priority/difficulty maps', () => {
    expect(colValue(kw({ estimatedVolume: '높음' }), 'volume')).toBe(3);
    expect(colValue(kw({ priority: 'high' }), 'priority')).toBe(3);
    expect(colValue(kw({ difficulty: '쉬움' }), 'difficulty')).toBe(1);
  });
});

describe('toggleSort', () => {
  it('click replaces with single desc; same col → asc; again → remove', () => {
    let s: SortState[] = toggleSort([], 'naver', false);
    expect(s).toEqual([{ col: 'naver', dir: 'desc' }]);
    s = toggleSort(s, 'naver', false);
    expect(s).toEqual([{ col: 'naver', dir: 'asc' }]);
    s = toggleSort(s, 'naver', false);
    expect(s).toEqual([]);
  });
  it('shift+click appends a second column', () => {
    const s = toggleSort([{ col: 'naver', dir: 'desc' }], 'google', true);
    expect(s).toEqual([
      { col: 'naver', dir: 'desc' },
      { col: 'google', dir: 'desc' },
    ]);
  });
  it('non-shift click replaces multi-sort with a single column', () => {
    const s = toggleSort([{ col: 'naver', dir: 'desc' }], 'google', false);
    expect(s).toEqual([{ col: 'google', dir: 'desc' }]);
  });
});

describe('sortIcon', () => {
  it('shows ↕ when unsorted, numbered arrows when multi-sorted', () => {
    expect(sortIcon([], 'naver')).toBe(' ↕');
    expect(sortIcon([{ col: 'naver', dir: 'desc' }], 'naver')).toBe(' ↓'); // single ⇒ no number
    const multi: SortState[] = [
      { col: 'naver', dir: 'desc' },
      { col: 'google', dir: 'asc' },
    ];
    expect(sortIcon(multi, 'naver')).toBe(' 1↓');
    expect(sortIcon(multi, 'google')).toBe(' 2↑');
  });
});

describe('sortKeywords', () => {
  it('multi-key tie-break: sort by naver desc then google desc', () => {
    const rows = [
      kw({ keyword: 'a', naverMonthly: 100, googleVolume: 5 }),
      kw({ keyword: 'b', naverMonthly: 100, googleVolume: 9 }),
      kw({ keyword: 'c', naverMonthly: 200, googleVolume: 1 }),
    ];
    const out = sortKeywords(rows, [
      { col: 'naver', dir: 'desc' },
      { col: 'google', dir: 'desc' },
    ]);
    expect(out.map((r) => r.keyword)).toEqual(['c', 'b', 'a']);
  });
  it('empty sort returns the input order', () => {
    const rows = [kw({ keyword: 'a' }), kw({ keyword: 'b' })];
    expect(sortKeywords(rows, []).map((r) => r.keyword)).toEqual(['a', 'b']);
  });
});
