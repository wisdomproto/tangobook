import { describe, it, expect } from 'vitest';
import { __toSummaryForTest as toSummary } from './r2.repository';
const base = {
  id: 'b1',
  title: '개구리 왕자',
  type: 'storybook',
  createdAt: '2026-01-01T00:00:00Z',
  artStyle: 'styleA',
  coverImage: 'https://r2/a-cover.webp',
  cleanCoverImage: 'https://r2/a-clean.webp',
  primaryCoverByLang: { ko: 'https://r2/a-ko.webp', vi: 'https://r2/a-vi.webp' },
  pages: [],
  key_objects: [],
} as any;
describe('toSummary covers (one book, one style)', () => {
  it('emits the book cover, clean cover and per-language covers', () => {
    const s = toSummary(base);
    expect(s.coverImage).toBe('https://r2/a-cover.webp');
    expect(s.cleanCoverImage).toBe('https://r2/a-clean.webp');
    expect(s.coversByLang).toEqual({ ko: 'https://r2/a-ko.webp', vi: 'https://r2/a-vi.webp' });
    expect(s.artStyle).toBe('styleA');
  });
  it('omits clean cover when there is none', () => {
    expect(toSummary({ ...base, cleanCoverImage: undefined }).cleanCoverImage).toBeUndefined();
  });
});
