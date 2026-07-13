import { describe, it, expect } from 'vitest';
import { getPageText, buildYoutubeMetaPrompt } from './youtube-meta-prompt';

const book = {
  title: '개구리 왕자',
  category: '세계명작',
  pages: [{ pageNumber: 1, text: '한글', translations: { en: { text: 'English page' } } }],
} as any;

describe('youtube-meta-prompt', () => {
  it('getPageText: 비-ko는 translations 우선, ko는 base', () => {
    expect(getPageText(book.pages[0], 'en')).toBe('English page');
    expect(getPageText(book.pages[0], 'ko')).toBe('한글');
  });

  it('getPageText: 번역 없으면 base 폴백', () => {
    expect(getPageText(book.pages[0], 'vi')).toBe('한글');
  });

  it('buildYoutubeMetaPrompt: 제목·언어지시·userPrompt 포함', () => {
    const p = buildYoutubeMetaPrompt(book, {
      language: 'en',
      aspectRatio: '16:9',
      userPrompt: 'kids audiobook',
    });
    expect(p).toContain('개구리 왕자');
    expect(p).toContain('English');
    expect(p).toContain('kids audiobook');
    expect(p).toContain('Aspect Ratio: 16:9');
  });

  it('buildYoutubeMetaPrompt: vi는 Vietnamese 지시', () => {
    const p = buildYoutubeMetaPrompt(book, {
      language: 'vi',
      aspectRatio: '16:9',
      userPrompt: 'x',
    });
    expect(p).toContain('Vietnamese');
  });
});
