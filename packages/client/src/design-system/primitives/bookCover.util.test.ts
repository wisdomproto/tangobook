import { describe, it, expect } from 'vitest';
import { resolveCover } from './bookCover.util';
const summary = {
  title: '개구리 왕자',
  titleTranslations: { en: 'The Frog Prince' },
  coverImage: 'legacy.webp',
  cleanCoverImage: 'clean.webp',
  cleanCoversByStyle: { styleB: 'cleanB.webp' },
  coversByStyle: { styleB: 'legacyB.webp' },
} as any;
describe('resolveCover', () => {
  it('prefers per-style clean cover, then representative clean, then legacy', () => {
    expect(resolveCover(summary, { style: 'styleB' }).img).toBe('cleanB.webp');
    expect(resolveCover(summary, {}).img).toBe('clean.webp');
    const noClean = { ...summary, cleanCoverImage: undefined, cleanCoversByStyle: undefined };
    expect(resolveCover(noClean, { style: 'styleB' }).img).toBe('legacyB.webp');
    expect(resolveCover(noClean, {}).img).toBe('legacy.webp');
  });
  it('marks hasClean=false on legacy fallback (overlay must be suppressed)', () => {
    const noClean = { ...summary, cleanCoverImage: undefined, cleanCoversByStyle: undefined };
    expect(resolveCover(summary, {}).hasClean).toBe(true);
    expect(resolveCover(noClean, {}).hasClean).toBe(false);
  });
  it('localizes title via titleTranslations[lang] with ko fallback', () => {
    expect(resolveCover(summary, { lang: 'en' }).title).toBe('The Frog Prince');
    expect(resolveCover(summary, { lang: 'zh' }).title).toBe('개구리 왕자');
  });
  it('normalizes BookIndexEntry field names', () => {
    const entry = { title: 'X', coverImageUrl: 'l.webp', cleanCoverImageUrl: 'c.webp' } as any;
    const r = resolveCover(entry, {});
    expect(r.img).toBe('c.webp');
    expect(r.hasClean).toBe(true);
  });
});
