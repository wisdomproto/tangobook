import { describe, it, expect } from 'vitest';
import {
  type GoldenCandidate,
  filterGoldenCandidates,
  dedupeByMaxVolume,
  classifyGoldenTiers,
} from '../golden-keyword.js';

const c = (keyword: string, vol: number, comp: GoldenCandidate['comp']): GoldenCandidate => ({
  keyword,
  vol,
  comp,
  pc: vol,
  mob: 0,
});

describe('filterGoldenCandidates (enum — R-1)', () => {
  it('keeps vol>=300 with comp LOW or MEDIUM, sorted by vol desc', () => {
    const out = filterGoldenCandidates([
      c('a', 500, 'LOW'),
      c('b', 299, 'LOW'), // below threshold
      c('c', 800, 'HIGH'), // wrong comp
      c('d', 1200, 'MEDIUM'),
    ]);
    expect(out.map((x) => x.keyword)).toEqual(['d', 'a']); // 1200, 500 (b/c dropped)
  });
  it('does NOT treat Korean strings as competition (enum only)', () => {
    // a Korean-string comp must fall through the LOW/MEDIUM filter
    const out = filterGoldenCandidates([
      { keyword: 'z', vol: 1000, comp: '낮음' as never, pc: 1000, mob: 0 },
    ]);
    expect(out).toHaveLength(0);
  });
});

describe('dedupeByMaxVolume', () => {
  it('keeps the highest-volume entry per keyword', () => {
    const map = dedupeByMaxVolume([c('a', 100, 'LOW'), c('a', 900, 'MEDIUM'), c('b', 50, 'LOW')]);
    expect(map.get('a')?.vol).toBe(900);
    expect(map.get('b')?.vol).toBe(50);
  });
});

describe('classifyGoldenTiers (enum — R-1)', () => {
  it('🏆 gold = vol>=1000 && comp===LOW (inclusive boundary)', () => {
    const { gold } = classifyGoldenTiers([
      c('g', 1000, 'LOW'),
      c('x', 999, 'LOW'),
      c('y', 2000, 'MEDIUM'),
    ]);
    expect(gold.map((g) => g.keyword)).toEqual(['g']);
  });
  it('🥇 silver = (LOW or (vol>=3000 && MEDIUM)) minus gold', () => {
    const { silver } = classifyGoldenTiers([
      c('g', 1500, 'LOW'), // gold
      c('s1', 400, 'LOW'), // silver (LOW, not gold)
      c('s2', 3000, 'MEDIUM'), // silver (vol>=3000 & MEDIUM)
      c('b', 1000, 'MEDIUM'), // bronze
    ]);
    expect(silver.map((s) => s.keyword).sort()).toEqual(['s1', 's2']);
  });
  it('🥈 bronze = everything not gold/silver', () => {
    const { bronze } = classifyGoldenTiers([c('b', 1000, 'MEDIUM'), c('g', 1500, 'LOW')]);
    expect(bronze.map((x) => x.keyword)).toEqual(['b']);
  });
});
