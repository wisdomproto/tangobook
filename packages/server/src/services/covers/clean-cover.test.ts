import { describe, it, expect } from 'vitest';
import { pickStyleCovers, buildCleanKey, parseGateVerdict } from './clean-cover';

describe('clean-cover helpers', () => {
  it('pickStyleCovers returns the book cover under its one style', () => {
    expect(pickStyleCovers({ artStyle: 'A', coverImage: 'a.webp' })).toEqual([
      { style: 'A', url: 'a.webp' },
    ]);
    expect(pickStyleCovers({ artStyle: 'A', coverImages: [{ imageUrl: 'c.webp' }] })).toEqual([
      { style: 'A', url: 'c.webp' },
    ]);
    expect(pickStyleCovers({ artStyle: 'A' })).toEqual([]);
  });
  it('buildCleanKey is deterministic per (id,style) with a ts', () => {
    expect(buildCleanKey('bk1', 'A', 123)).toBe('covers/clean/bk1-A-123.webp');
  });
  it('parseGateVerdict passes only when subject/composition same AND no text', () => {
    expect(parseGateVerdict({ sameSubject: true, textRemains: false }).pass).toBe(true);
    expect(parseGateVerdict({ sameSubject: false, textRemains: false }).pass).toBe(false);
    expect(parseGateVerdict({ sameSubject: true, textRemains: true }).pass).toBe(false);
  });
  it('parseGateVerdict fails closed on an incomplete verdict', () => {
    expect(parseGateVerdict({ sameSubject: true } as any).pass).toBe(false);
  });
});
