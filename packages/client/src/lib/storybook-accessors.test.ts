import { describe, it, expect } from 'vitest';
import type { Storybook } from '@tangobook/shared';
import {
  hasVideoUrl,
  getPrimaryVideoId,
  getAvailableLanguages,
  hasGames,
} from './storybook-accessors';

const makeStorybook = (overrides: Partial<Storybook> = {}): Storybook => ({
  id: 's1',
  title: 'Test',
  targetAge: '4-5',
  artStyle: 'flat',
  createdAt: '2026-04-22T00:00:00Z',
  characters: [],
  pages: [],
  educational_content: { vocabulary: [], quiz: [], learning_objectives: [], moral_lesson: '' },
  ...overrides,
});

describe('hasVideoUrl', () => {
  it('returns false for empty book', () => {
    expect(hasVideoUrl(makeStorybook())).toBe(false);
  });

  it('returns true when audiobookProjects has a youtubeUpload', () => {
    const book = makeStorybook({
      audiobookProjects: [
        {
          id: 'a1',
          title: 'v1',
          createdAt: '2026-01-01',
          youtubeUpload: { videoId: 'abc', videoUrl: 'u', uploadedAt: '2026-01-02' },
        } as any,
      ],
    });
    expect(hasVideoUrl(book)).toBe(true);
  });

  it('returns true when longformProjects has a youtubeUpload', () => {
    const book = makeStorybook({
      longformProjects: [
        {
          id: 'l1',
          title: 'v1',
          createdAt: '2026-01-01',
          scenes: [],
          youtubeUpload: { videoId: 'xyz', videoUrl: 'u', uploadedAt: '2026-01-02' },
        } as any,
      ],
    });
    expect(hasVideoUrl(book)).toBe(true);
  });

  it('returns false when projects exist but no youtubeUpload', () => {
    const book = makeStorybook({
      audiobookProjects: [{ id: 'a1', title: 'v1', createdAt: '2026-01-01' } as any],
    });
    expect(hasVideoUrl(book)).toBe(false);
  });
});

describe('getPrimaryVideoId', () => {
  it('returns null when no video', () => {
    expect(getPrimaryVideoId(makeStorybook())).toBeNull();
  });

  it('returns audiobook videoId when only audiobook exists', () => {
    const book = makeStorybook({
      audiobookProjects: [
        {
          id: 'a1',
          youtubeUpload: { videoId: 'A', videoUrl: 'u', uploadedAt: '2026-01-01' },
        } as any,
      ],
    });
    expect(getPrimaryVideoId(book)).toBe('A');
  });

  it('returns latest upload across projects by uploadedAt', () => {
    const book = makeStorybook({
      audiobookProjects: [
        {
          id: 'a1',
          youtubeUpload: { videoId: 'OLD', videoUrl: 'u', uploadedAt: '2026-01-01' },
        } as any,
      ],
      longformProjects: [
        {
          id: 'l1',
          youtubeUpload: { videoId: 'NEW', videoUrl: 'u', uploadedAt: '2026-03-01' },
        } as any,
      ],
    });
    expect(getPrimaryVideoId(book)).toBe('NEW');
  });
});

describe('getAvailableLanguages', () => {
  it('returns [] for book with no pages', () => {
    expect(getAvailableLanguages(makeStorybook())).toEqual([]);
  });

  it('returns ["ko"] when pages exist but no translations', () => {
    const book = makeStorybook({
      pages: [{ pageNumber: 1, text: '안녕', scene_description: '', scene_structure: {} as any }],
    });
    expect(getAvailableLanguages(book)).toEqual(['ko']);
  });

  it('adds extra languages from translations keys', () => {
    const book = makeStorybook({
      pages: [
        {
          pageNumber: 1,
          text: '안녕',
          scene_description: '',
          scene_structure: {} as any,
          translations: { en: { text: 'Hi' }, ja: { text: 'こんにちは' } },
        },
      ],
    });
    expect(getAvailableLanguages(book).sort()).toEqual(['en', 'ja', 'ko']);
  });

  it('does not duplicate ko if translations somehow include ko', () => {
    const book = makeStorybook({
      pages: [
        {
          pageNumber: 1,
          text: '안녕',
          scene_description: '',
          scene_structure: {} as any,
          translations: { ko: { text: '안녕' }, en: { text: 'Hi' } },
        },
      ],
    });
    const langs = getAvailableLanguages(book);
    expect(langs.filter((l) => l === 'ko')).toHaveLength(1);
    expect(langs).toContain('en');
  });
});

describe('hasGames', () => {
  it('returns false for undefined games', () => {
    expect(hasGames(makeStorybook())).toBe(false);
  });

  it('returns false for empty array', () => {
    expect(hasGames(makeStorybook({ games: [] }))).toBe(false);
  });

  it('returns true when games array has items', () => {
    expect(hasGames(makeStorybook({ games: [{ id: 'g1' } as any] }))).toBe(true);
  });
});
