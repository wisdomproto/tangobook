import type { Storybook, StoryMusicSet } from '@tangobook/shared';

/** One track per reading session; staged cues remain stored for future use. */
export function readingMusicUrls(book: Storybook): string[] {
  const sets = book.backgroundMusicSets ?? [];
  const urls = sets
    .filter((set) => set.genre === storyMusicGenre(book.category))
    .flatMap((set) => set.cues.map((cue) => cue.url.trim()))
    .filter(Boolean);
  if (urls.length) return [...new Set(urls)];
  // Older books with cues but no genre-tagged sets remain compatible.
  if (!sets.length) {
    const cues = (book.backgroundMusicCues ?? []).map((cue) => cue.url.trim()).filter(Boolean);
    if (cues.length) return [...new Set(cues)];
  }
  if (book.backgroundMusicUrl?.trim()) return [book.backgroundMusicUrl.trim()];
  return Array.from({ length: 5 }, (_, i) => `/sounds/bgm/default-${i + 1}.mp3`);
}

export function chooseReadingMusic(urls: string[], random = Math.random): string | undefined {
  return urls[Math.min(urls.length - 1, Math.floor(Math.max(0, random()) * urls.length))];
}

/** Cues refer to printed page numbers, independent of narration speed/language. */
export function storyMusicUrl(
  book: Storybook,
  pageNumber: number,
  set?: StoryMusicSet
): string | undefined {
  const cue = [...(set?.cues ?? book.backgroundMusicCues ?? [])]
    .filter(
      (c) =>
        Number.isInteger(c.startPage) &&
        c.startPage >= 1 &&
        c.startPage <= pageNumber &&
        c.url.trim()
    )
    .sort((a, b) => b.startPage - a.startPage)[0];
  return cue?.url || book.backgroundMusicUrl;
}

export function storyMusicGenre(category?: string): StoryMusicSet['genre'] {
  return category?.replace(/\s/g, '').includes('전래') ? 'folktale' : 'classic';
}

export function eligibleMusicSets(book: Storybook): StoryMusicSet[] {
  return (book.backgroundMusicSets ?? []).filter(
    (set) =>
      set.genre === storyMusicGenre(book.category) &&
      set.cues.length === 3 &&
      new Set(set.cues.map((c) => c.startPage)).size === 3 &&
      set.cues.every(
        (c) =>
          Number.isInteger(c.startPage) &&
          c.startPage >= 1 &&
          c.startPage <= book.pages.length &&
          c.url.trim()
      )
  );
}

export function chooseMusicSet(
  sets: StoryMusicSet[],
  random = Math.random
): StoryMusicSet | undefined {
  return sets[Math.min(sets.length - 1, Math.floor(Math.max(0, random()) * sets.length))];
}
