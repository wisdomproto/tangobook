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
  // 접근 B: 실제 표지(원본 ko/en · 구운 vi/th/zh)를 항상 우선. 클린 표지는 굽기 베이스라 직접 노출 X.
  it('prefers the real cover (per-style then representative), never the clean base', () => {
    expect(resolveCover(summary, { style: 'styleB' }).img).toBe('legacyB.webp');
    expect(resolveCover(summary, {}).img).toBe('legacy.webp');
  });
  it('falls back to clean only when no real cover exists', () => {
    const noLegacy = { ...summary, coverImage: undefined, coversByStyle: undefined };
    expect(resolveCover(noLegacy, { style: 'styleB' }).img).toBe('cleanB.webp');
    expect(resolveCover(noLegacy, {}).img).toBe('clean.webp');
  });
  it('hasClean=true only when falling back to clean (else overlay suppressed)', () => {
    expect(resolveCover(summary, {}).hasClean).toBe(false);
    const noLegacy = { ...summary, coverImage: undefined, coversByStyle: undefined };
    expect(resolveCover(noLegacy, {}).hasClean).toBe(true);
  });
  it('localizes title via titleTranslations[lang] with ko fallback', () => {
    expect(resolveCover(summary, { lang: 'en' }).title).toBe('The Frog Prince');
    expect(resolveCover(summary, { lang: 'zh' }).title).toBe('개구리 왕자');
  });
  it('normalizes BookIndexEntry field names (real cover wins)', () => {
    const entry = { title: 'X', coverImageUrl: 'l.webp', cleanCoverImageUrl: 'c.webp' } as any;
    const r = resolveCover(entry, {});
    expect(r.img).toBe('l.webp');
    expect(r.hasClean).toBe(false);
  });
});
