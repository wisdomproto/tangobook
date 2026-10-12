import { describe, expect, it } from 'vitest';
import type { Storybook } from '@tangobook/shared';
import { auditLibraryBook, completeCount, r2AssetKey } from './content-audit';

function book(): Storybook {
  return {
    id: 'audit-book',
    title: '조사 책',
    artStyle: 'pencil',
    targetAge: '4-5',
    createdAt: '',
    characters: [],
    educational_content: {},
    pages: [
      {
        pageNumber: 1,
        text: '안녕',
        illustrationUrl: 'https://assets.tangobook.co.kr/page.webp',
        ttsUrl: 'https://assets.tangobook.co.kr/ko.mp3',
        translations: { en: { text: 'Hello', ttsUrl: 'https://assets.tangobook.co.kr/en.mp3' } },
      },
      { pageNumber: 2, text: '', illustrationUrl: 'https://assets.tangobook.co.kr/end.webp' },
    ],
    key_objects: [{ name: 'Apple', nameEn: 'Apple', korean: '사과' }],
    keyObjectImages: [
      { objectName: 'Apple', imageUrl: 'https://assets.tangobook.co.kr/apple.webp' },
    ],
  } as unknown as Storybook; // Minimal legacy-book fixture: only fields consumed by the audit.
}
describe('library content evidence', () => {
  it('requires illustrations on textless pages but excludes them from narration and translation', () => {
    const row = auditLibraryBook(book(), {}, {});
    expect(row.illustrations).toMatchObject({ have: 2, total: 2 });
    expect(row.ko).toMatchObject({ have: 1, total: 1 });
    expect(row.en).toMatchObject({ have: 1, total: 1 });
    expect(row.english).toMatchObject({ have: 1, total: 1 });
    expect(completeCount({ have: 0, total: 0, missing: [], broken: [] })).toBe(false);
  });
  it('distinguishes unregistered and missing files, without changing the source book', () => {
    const b = book();
    b.pages[0].ttsUrl = undefined;
    const before = structuredClone(b);
    const row = auditLibraryBook(b, {}, {}, new Set(['end.webp', 'en.mp3']));
    expect(row.illustrations.broken).toEqual(['1쪽']);
    expect(row.ko.missing).toEqual(['1쪽']);
    expect(row.words.broken).toEqual(['사과']);
    expect(row.games.ko).not.toContain('korean-story-image');
    expect(b).toEqual(before);
  });
  it('uses inherited coloring sheets and real language labels instead of counting every sheet', () => {
    const b = book();
    b.splitFrom = { bookId: 'source-book', styleId: 'other' };
    const row = auditLibraryBook(b, { 'source-book': ['Apple', 'unknown'] }, {});
    expect(row.coloring).toMatchObject({ total: 2, ko: 1, en: 1 });
    expect(row.games.ko).toContain('coloring');
    expect(row.games.ko).not.toContain('connect-the-dots');
  });
  it('does not claim vocabulary cards are exposed when vocabulary is hidden', () => {
    const b = book();
    b.hideVocabulary = true;
    expect(auditLibraryBook(b, { 'audit-book': ['Apple'] }, {}).games.ko).not.toContain('coloring');
  });
  it('recognizes encoded CDN and proxy keys, leaving external URLs unverified', () => {
    expect(r2AssetKey('https://assets.tangobook.co.kr/a%20b.webp')).toBe('a b.webp');
    expect(r2AssetKey('/api/images/proxy?key=folder%2Fimage.webp')).toBe('folder/image.webp');
    expect(r2AssetKey('https://example.com/image.webp')).toBeUndefined();
  });
});
