import { describe, expect, it } from 'vitest';
import {
  manifestKey,
  textSliceKey,
  audioFileKey,
  styleCharactersKey,
  styleCoverKey,
  stylePageImageKey,
  styleKeyObjectImageKey,
  styleVocabImageKey,
  gameInstanceKey,
  audiobookProjectKey,
  audiobookRenderKey,
  audiobookRenderMetaKey,
  longformProjectKey,
  longformVideoKey,
  blogPostKey,
  cardNewsKey,
  bookIndexKey,
  parseTextSliceKey,
  parseAudiobookRenderKey,
  parseStylePageImageKey,
  parseManifestKey,
} from './book-v2-keys.js';

describe('book-v2-keys: builders', () => {
  const bid = '1772510956605';

  it('manifestKey', () => {
    expect(manifestKey(bid)).toBe(`books/${bid}/manifest.json`);
  });

  it('textSliceKey', () => {
    expect(textSliceKey(bid, 'L3', 'ko')).toBe(`books/${bid}/texts/L3.ko.json`);
    expect(textSliceKey(bid, 'L1', 'zh-CN')).toBe(`books/${bid}/texts/L1.zh-CN.json`);
  });

  it('audioFileKey', () => {
    expect(audioFileKey(bid, 'L3', 'ko', 1)).toBe(`books/${bid}/audio/L3.ko/page-1.mp3`);
    expect(audioFileKey(bid, 'L3', 'en', 22)).toBe(`books/${bid}/audio/L3.en/page-22.mp3`);
  });

  it('style files', () => {
    expect(styleCharactersKey(bid, 'watercolor')).toBe(
      `books/${bid}/styles/watercolor/characters.json`
    );
    expect(styleCoverKey(bid, 'cartoon')).toBe(`books/${bid}/styles/cartoon/cover.webp`);
    expect(styleCoverKey(bid, 'cartoon', 'png')).toBe(`books/${bid}/styles/cartoon/cover.png`);
    expect(stylePageImageKey(bid, 'watercolor', 'L3', 'p1')).toBe(
      `books/${bid}/styles/watercolor/pages/L3/p1.webp`
    );
    expect(styleKeyObjectImageKey(bid, 'watercolor', 'apple')).toBe(
      `books/${bid}/styles/watercolor/key-objects/apple.webp`
    );
    expect(styleVocabImageKey(bid, 'paper-craft', 'forest')).toBe(
      `books/${bid}/styles/paper-craft/vocabulary/forest.webp`
    );
  });

  it('game/audiobook/longform/marketing', () => {
    expect(gameInstanceKey(bid, 'g1')).toBe(`books/${bid}/games/g1.json`);
    expect(audiobookProjectKey(bid)).toBe(`books/${bid}/audiobook/project.json`);
    expect(audiobookRenderKey(bid, 'L3', 'ko', 'watercolor')).toBe(
      `books/${bid}/audiobook/renders/L3.ko.watercolor.mp4`
    );
    expect(audiobookRenderMetaKey(bid, 'L3', 'ko', 'watercolor')).toBe(
      `books/${bid}/audiobook/renders/L3.ko.watercolor.meta.json`
    );
    expect(longformProjectKey(bid, 'lf-001')).toBe(`books/${bid}/longform/lf-001.json`);
    expect(longformVideoKey(bid, 'lf-001')).toBe(`books/${bid}/longform/lf-001.mp4`);
    expect(blogPostKey(bid, 'post1')).toBe(`books/${bid}/marketing/blog/post1.json`);
    expect(cardNewsKey(bid, 'cn1')).toBe(`books/${bid}/marketing/card-news/cn1.json`);
  });

  it('bookIndexKey', () => {
    expect(bookIndexKey()).toBe('_index/books.json');
  });
});

describe('book-v2-keys: validation', () => {
  const bid = 'b1';

  it('rejects invalid bid', () => {
    expect(() => manifestKey('with/slash')).toThrow(/invalid bid/);
    expect(() => manifestKey('')).toThrow(/invalid bid/);
    expect(() => manifestKey('-leading-dash')).toThrow(/invalid bid/);
  });

  it('rejects invalid level', () => {
    expect(() => textSliceKey(bid, 'L5' as never, 'ko')).toThrow(/invalid level/);
    expect(() => textSliceKey(bid, 'X' as never, 'ko')).toThrow(/invalid level/);
  });

  it('rejects invalid language', () => {
    expect(() => textSliceKey(bid, 'L3', 'KOREAN')).toThrow(/invalid language/);
    expect(() => textSliceKey(bid, 'L3', 'k')).toThrow(/invalid language/);
  });

  it('rejects invalid style', () => {
    expect(() => styleCharactersKey(bid, 'Watercolor')).toThrow(/invalid style/);
    expect(() => styleCharactersKey(bid, 'with space')).toThrow(/invalid style/);
  });

  it('rejects invalid pageNumber', () => {
    expect(() => audioFileKey(bid, 'L3', 'ko', 0)).toThrow(/pageNumber/);
    expect(() => audioFileKey(bid, 'L3', 'ko', -1)).toThrow(/pageNumber/);
    expect(() => audioFileKey(bid, 'L3', 'ko', 1.5)).toThrow(/pageNumber/);
  });

  it('rejects path traversal in tokens', () => {
    expect(() => stylePageImageKey(bid, 'watercolor', 'L3', '../escape')).toThrow();
    expect(() => gameInstanceKey(bid, 'g/1')).toThrow();
  });
});

describe('book-v2-keys: parsers', () => {
  it('parseTextSliceKey', () => {
    expect(parseTextSliceKey('books/b1/texts/L3.ko.json')).toEqual({
      bid: 'b1',
      level: 'L3',
      language: 'ko',
    });
    expect(parseTextSliceKey('books/b1/texts/L1.zh-CN.json')?.language).toBe('zh-CN');
    expect(parseTextSliceKey('books/b1/manifest.json')).toBeNull();
    expect(parseTextSliceKey('books/b1/texts/X.ko.json')).toBeNull();
  });

  it('parseAudiobookRenderKey', () => {
    expect(parseAudiobookRenderKey('books/b1/audiobook/renders/L3.ko.watercolor.mp4')).toEqual({
      bid: 'b1',
      level: 'L3',
      language: 'ko',
      style: 'watercolor',
      meta: false,
      ext: 'mp4',
    });
    expect(
      parseAudiobookRenderKey('books/b1/audiobook/renders/L3.ko.watercolor.meta.json')?.meta
    ).toBe(true);
    expect(parseAudiobookRenderKey('books/b1/random.mp4')).toBeNull();
  });

  it('parseStylePageImageKey', () => {
    expect(parseStylePageImageKey('books/b1/styles/paper-craft/pages/L3/p1.webp')).toEqual({
      bid: 'b1',
      style: 'paper-craft',
      level: 'L3',
      illustrationKey: 'p1',
      ext: 'webp',
    });
    expect(parseStylePageImageKey('books/b1/styles/paper-craft/cover.webp')).toBeNull();
  });

  it('parseManifestKey', () => {
    expect(parseManifestKey('books/b1/manifest.json')).toEqual({ bid: 'b1' });
    expect(parseManifestKey('books/b1/texts/L3.ko.json')).toBeNull();
  });
});

describe('book-v2-keys: every key starts with "books/" or "_index/"', () => {
  const bid = 'b1';
  const cases: string[] = [
    manifestKey(bid),
    textSliceKey(bid, 'L1', 'ko'),
    audioFileKey(bid, 'L1', 'ko', 1),
    styleCharactersKey(bid, 'watercolor'),
    styleCoverKey(bid, 'watercolor'),
    stylePageImageKey(bid, 'watercolor', 'L1', 'p1'),
    styleKeyObjectImageKey(bid, 'watercolor', 'k1'),
    styleVocabImageKey(bid, 'watercolor', 'v1'),
    gameInstanceKey(bid, 'g1'),
    audiobookProjectKey(bid),
    audiobookRenderKey(bid, 'L1', 'ko', 'watercolor'),
    audiobookRenderMetaKey(bid, 'L1', 'ko', 'watercolor'),
    longformProjectKey(bid, 'lf1'),
    longformVideoKey(bid, 'lf1'),
    blogPostKey(bid, 'p1'),
    cardNewsKey(bid, 'c1'),
    bookIndexKey(),
  ];

  it.each(cases)('valid prefix: %s', (key) => {
    expect(key).toMatch(/^(books\/|_index\/)/);
    expect(key.startsWith('/')).toBe(false);
    expect(key.includes('//')).toBe(false);
  });
});
