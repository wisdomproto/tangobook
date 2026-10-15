import { describe, expect, it } from 'vitest';
import type { Storybook } from '@tangobook/shared';
import {
  storyMusicUrl,
  eligibleMusicSets,
  chooseMusicSet,
  readingMusicUrls,
  chooseReadingMusic,
} from './story-music';

describe('single-track random reading music', () => {
  const sample = {
    category: '한국 전래동화',
    backgroundMusicSets: [
      { genre: 'classic', cues: [{ url: 'western' }] },
      { genre: 'folktale', cues: [{ url: ' opening ' }, { url: 'climax' }, { url: 'opening' }] },
    ],
  } as Storybook;
  it('keeps only matching genre and gives each unique track one chance', () => {
    const urls = readingMusicUrls(sample);
    expect(urls).toEqual(['opening', 'climax']);
    expect(chooseReadingMusic(urls, () => 0)).toBe('opening');
    expect(chooseReadingMusic(urls, () => 0.9)).toBe('climax');
  });
  it('does not require three stages or use page boundaries', () => {
    expect(readingMusicUrls({ ...sample, category: '명작동화' })).toEqual(['western']);
    expect(readingMusicUrls(book)).toEqual(['resolution', 'opening', 'climax', 'tension']);
  });
  it('preserves old single tracks and avoids borrowing another genre', () => {
    expect(readingMusicUrls({ backgroundMusicUrl: 'old' } as Storybook)).toEqual(['old']);
    expect(
      readingMusicUrls({ ...sample, backgroundMusicSets: [sample.backgroundMusicSets![0]] })
    ).toEqual(Array.from({ length: 5 }, (_, i) => `/sounds/bgm/default-${i + 1}.mp3`));
    expect(chooseReadingMusic([])).toBeUndefined();
  });
});

const book = {
  backgroundMusicUrl: 'legacy',
  backgroundMusicCues: [
    { id: 'r', startPage: 15, url: 'resolution' },
    { id: 'o', startPage: 1, url: 'opening' },
    { id: 'c', startPage: 12, url: 'climax' },
    { id: 't', startPage: 6, url: 'tension' },
  ],
} as Storybook;
describe('story cue selection', () => {
  it('selects by printed page, supports unsorted input and backwards jumps', () => {
    expect([1, 5, 6, 11, 12, 14, 15, 2].map((p) => storyMusicUrl(book, p))).toEqual([
      'opening',
      'opening',
      'tension',
      'tension',
      'climax',
      'climax',
      'resolution',
      'opening',
    ]);
  });
  it('keeps legacy books and rejects invalid cue boundaries/empty URLs', () => {
    expect(storyMusicUrl({ backgroundMusicUrl: 'old' } as Storybook, 9)).toBe('old');
    expect(
      storyMusicUrl(
        {
          ...book,
          backgroundMusicCues: [
            { id: 'bad', startPage: -1, url: 'bad' },
            { id: 'empty', startPage: 1, url: ' ' },
          ],
        },
        3
      )
    ).toBe('legacy');
  });
});

it('keeps a selected three-cue set across page changes and separates genres', () => {
  const cues = [
    { id: 'o', startPage: 1, url: 'o' },
    { id: 'c', startPage: 6, url: 'c' },
    { id: 'r', startPage: 15, url: 'r' },
  ];
  const classic = { id: 'classic', title: 'Classic', genre: 'classic' as const, cues };
  const folk = { id: 'folk', title: 'Folk', genre: 'folktale' as const, cues };
  const sample = {
    ...book,
    category: '세계 명작',
    pages: Array(15).fill({}),
    backgroundMusicSets: [classic, folk],
  };
  expect(eligibleMusicSets(sample)).toEqual([classic]);
  expect(eligibleMusicSets({ ...sample, category: '한국 전래동화' })).toEqual([folk]);
  const selected = chooseMusicSet([classic, { ...classic, id: 'second' }], () => 0.75)!;
  expect(selected.id).toBe('second');
  expect([1, 6, 15, 2].map((p) => storyMusicUrl(sample, p, selected))).toEqual([
    'o',
    'c',
    'r',
    'o',
  ]);
  expect(chooseMusicSet([])).toBeUndefined();
  expect(
    eligibleMusicSets({ ...sample, backgroundMusicSets: [{ ...classic, cues: cues.slice(0, 2) }] })
  ).toEqual([]);
});
