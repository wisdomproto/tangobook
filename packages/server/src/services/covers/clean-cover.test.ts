import { describe, it, expect } from 'vitest';
import { pickStyleCovers, buildCleanKey, parseGateVerdict } from './clean-cover';

describe('clean-cover helpers', () => {
  it('pickStyleCovers returns (style,url) for active + styleAssets', () => {
    const sb = {
      artStyle: 'A',
      coverImage: 'a.webp',
      styleAssets: { B: { coverImage: 'b.webp' }, C: { coverImages: [{ imageUrl: 'c.webp' }] } },
    } as any;
    expect(pickStyleCovers(sb)).toEqual([
      { style: 'A', url: 'a.webp' },
      { style: 'B', url: 'b.webp' },
      { style: 'C', url: 'c.webp' },
    ]);
  });
  it('buildCleanKey is deterministic per (id,style) with a ts', () => {
    expect(buildCleanKey('bk1', 'A', 123)).toBe('covers/clean/bk1-A-123.webp');
  });
  it('parseGateVerdict passes only when subject/composition same AND no text', () => {
    expect(parseGateVerdict({ sameSubject: true, textRemains: false }).pass).toBe(true);
    expect(parseGateVerdict({ sameSubject: false, textRemains: false }).pass).toBe(false);
    expect(parseGateVerdict({ sameSubject: true, textRemains: true }).pass).toBe(false);
  });
});
