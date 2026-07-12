import { describe, it, expect } from 'vitest';
import { __toSummaryForTest as toSummary } from './r2.repository';
const base = {
  id: 'b1',
  title: '개구리 왕자',
  type: 'storybook',
  createdAt: '2026-01-01T00:00:00Z',
  artStyle: 'styleA',
  defaultStyle: 'styleA',
  availableStyles: ['styleA', 'styleB'],
  coverImage: 'https://r2/a-cover.webp',
  cleanCoverImage: 'https://r2/a-clean.webp',
  styleAssets: {
    styleB: { coverImage: 'https://r2/b-cover.webp', cleanCoverImage: 'https://r2/b-clean.webp' },
  },
  pages: [],
  key_objects: [],
} as any;
describe('toSummary cleanCover', () => {
  it('emits representative cleanCoverImage + per-style map', () => {
    const s = toSummary(base);
    expect(s.cleanCoverImage).toBe('https://r2/a-clean.webp');
    expect(s.cleanCoversByStyle).toEqual({
      styleA: 'https://r2/a-clean.webp',
      styleB: 'https://r2/b-clean.webp',
    });
  });
  it('omits clean fields when no clean covers exist', () => {
    const s = toSummary({ ...base, cleanCoverImage: undefined, styleAssets: {} });
    expect(s.cleanCoverImage).toBeUndefined();
    expect(s.cleanCoversByStyle).toBeUndefined();
  });
});
