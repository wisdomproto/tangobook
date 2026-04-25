import { beforeAll, describe, expect, it } from 'vitest';
import type {
  BookManifest,
  BookTextSlice,
  BookStyleSlice,
  BookGameInstance,
} from '@tangobook/shared';
import { mergeForViewer, mergeForGame } from './book-v2-runtime-merge.js';

beforeAll(() => {
  process.env.R2_PUBLIC_URL = 'https://r2.example.com';
});

const manifest: BookManifest = {
  id: 'b1',
  title: '잭과 콩나무',
  type: 'storybook',
  category: '명작',
  usedVariants: { levels: ['L3'], languages: ['ko'], styles: ['watercolor'] },
  keyObjectIds: ['k_giant', 'k_cow'],
  vocabIds: [],
  parentGuide: { overview: 'o', lessons: ['l1'], readingTips: ['t1'] },
  bgmUrl: 'https://r2.example.com/bgm.mp3',
  createdAt: '2026-04-25T00:00:00Z',
  updatedAt: '2026-04-25T00:00:00Z',
};

const textSlice: BookTextSlice = {
  level: 'L3',
  language: 'ko',
  title: '잭과 콩나무',
  intro: '옛날 옛적에...',
  pages: [
    { pageNumber: 1, text: '잭이 콩을 받았다.', illustrationKey: 'p1' },
    { pageNumber: 2, text: '콩나무가 자랐다.', illustrationKey: 'p2' },
    { pageNumber: 3, text: '거인을 만났다.', illustrationKey: 'p3' },
  ],
  keyObjectsText: {
    k_giant: { word: 'giant', korean: '거인' },
    k_cow: { word: 'cow', korean: '소' },
  },
  vocabText: {},
};

const styleSlice: BookStyleSlice = {
  style: 'watercolor',
  characters: [],
  coverImageUrl: 'https://r2.example.com/books/b1/styles/watercolor/cover.webp',
  coverImageHistory: [],
  pageImages: {
    L3: {
      p1: 'https://r2.example.com/books/b1/styles/watercolor/pages/L3/p1.webp',
      p2: 'https://r2.example.com/books/b1/styles/watercolor/pages/L3/p2.webp',
      // p3 missing intentionally
    },
  },
  keyObjectImages: {
    k_giant: 'https://r2.example.com/books/b1/styles/watercolor/key-objects/k_giant.webp',
    // k_cow missing
  },
  vocabImages: {},
};

describe('mergeForViewer', () => {
  it('merges manifest + textSlice + styleSlice into viewer payload', () => {
    const out = mergeForViewer({ manifest, textSlice, styleSlice });
    expect(out.bid).toBe('b1');
    expect(out.level).toBe('L3');
    expect(out.language).toBe('ko');
    expect(out.style).toBe('watercolor');
    expect(out.title).toBe('잭과 콩나무');
    expect(out.coverImageUrl).toContain('cover.webp');
    expect(out.parentGuide?.overview).toBe('o');
    expect(out.bgmUrl).toContain('bgm.mp3');
  });

  it('builds tts url from audioFileKey path', () => {
    const out = mergeForViewer({ manifest, textSlice, styleSlice });
    expect(out.pages[0].ttsUrl).toBe('https://r2.example.com/books/b1/audio/L3.ko/page-1.mp3');
    expect(out.pages[2].ttsUrl).toBe('https://r2.example.com/books/b1/audio/L3.ko/page-3.mp3');
  });

  it('warns on missing page image', () => {
    const out = mergeForViewer({ manifest, textSlice, styleSlice });
    expect(out.pages[0].illustrationUrl).toContain('p1.webp');
    expect(out.pages[2].illustrationUrl).toBeUndefined();
    expect(out.warnings.some((w) => w.includes('p3'))).toBe(true);
  });
});

describe('mergeForGame', () => {
  const instance: BookGameInstance = {
    id: 'g1',
    gameType: 'korean-line-matching',
    config: {} as never,
    data: {} as never,
    level: 'L3',
    language: 'ko',
    imageRefs: [
      { kind: 'keyObj', refId: 'k_giant' },
      { kind: 'keyObj', refId: 'k_cow' }, // missing image
      { kind: 'page', refId: 'p1' },
      { kind: 'page', refId: 'pNeverExists' }, // missing
    ],
    createdAt: '2026-04-25T00:00:00Z',
  };

  it('resolves keyObj/page images and warns on missing', () => {
    const out = mergeForGame({ instance, styleSlice, textSlice });
    const [r1, r2, r3, r4] = out.resolvedImages;
    expect(r1.url).toContain('k_giant.webp');
    expect(r2.url).toBeUndefined();
    expect(r3.url).toContain('p1.webp');
    expect(r4.url).toBeUndefined();
    expect(out.warnings).toHaveLength(2);
  });

  it('attaches refText from keyObjectsText', () => {
    const out = mergeForGame({ instance, styleSlice, textSlice });
    expect(out.refText.k_giant).toEqual({ word: 'giant', korean: '거인' });
    expect(out.refText.k_cow.korean).toBe('소');
  });

  it('handles missing textSlice gracefully', () => {
    const out = mergeForGame({ instance, styleSlice });
    expect(Object.keys(out.refText)).toHaveLength(0);
  });
});
