import { describe, expect, it, vi } from 'vitest';
import type {
  ColoringCatalogEntry,
  HiddenObjectData,
  Storybook,
  StorybookSummary,
} from '@tangobook/shared';
import { easyHiddenScene, isEasyPlayWord, makeFreePlayRound } from './free-play';

const book = (id = 'ready'): Storybook =>
  ({
    id,
    title: '놀이 책',
    type: 'storybook',
    category: '세계 명작',
    targetAge: '4-5',
    artStyle: 'paper',
    createdAt: '2026-10-16',
    characters: [],
    educational_content: { vocabulary: [], quiz: [], learning_objectives: [], moral_lesson: '' },
    isPublic: true,
    pages: [],
    key_objects: ['나무', '아기', '가방', '까치', '고양이'].map((word) => ({
      name: word,
      korean: word,
      description: '',
      pages: [],
      ttsUrl: `${word}.mp3`,
    })),
    keyObjectImages: ['나무', '아기', '가방', '까치', '고양이'].map((word) => ({
      objectName: word,
      imageUrl: `${word}.webp`,
      success: true,
    })),
  }) as Storybook;
const coloring = (id = 'ready'): ColoringCatalogEntry => ({
  key: id,
  bookId: id,
  word: '나무',
  group: '동화',
  section: '놀이 책',
  lineartUrl: 'outline.webp',
  originalUrl: 'tree.webp',
});
const summary = (id: string, isPublic = true) =>
  ({ id, isPublic, type: 'storybook', category: '세계 명작' }) as StorybookSummary;

describe('easy standalone practice', () => {
  it.each(['나무', '아기', '오리', '기차', '하마', '호수', '소'])(
    '%s is short and has only basic open syllables',
    (word) => expect(isEasyPlayWord(word)).toBe(true)
  );
  it.each(['가방', '꽃', '까치', '고양이', '개', '고래', 'a', '나 무', ''])(
    'rejects %s from the beginner pool',
    (word) => expect(isEasyPlayWord(word)).toBe(false)
  );

  it.each(['blocks', 'writing'] as const)(
    '%s starts with real easy words, images and TTS from one public book',
    async (kind) => {
      const round = await makeFreePlayRound(kind, {
        books: [summary('ready')],
        coloring: [coloring()],
        loadBook: async () => book(),
      });
      expect(round?.kind).toBe(kind);
      if (!round || round.kind !== kind) throw new Error('missing round');
      const words = 'data' in round && 'items' in round.data ? round.data.items : [];
      expect(words.length).toBeGreaterThan(0);
      expect(words.length).toBeLessThanOrEqual(3);
      expect(words.map((item) => item.word).sort()).toEqual(['나무', '아기']);
      expect(words.every((item) => item.imageUrl && item.ttsUrl)).toBe(true);
      expect(round.bookId).toBe('ready');
    }
  );

  it('never fetches private or absent books from a stale catalog', async () => {
    const loadBook = vi.fn(async () => book());
    const round = await makeFreePlayRound('coloring', {
      books: [summary('private', false)],
      coloring: [coloring('private'), coloring('missing')],
      loadBook,
    });
    expect(round).toBeNull();
    expect(loadBook).not.toHaveBeenCalled();
  });
  it('rechecks publication and vocabulary opt-out on the actual book', async () => {
    for (const changes of [
      { isPublic: false },
      { hideVocabulary: true },
      { category: '자연관찰' },
    ]) {
      const round = await makeFreePlayRound('writing', {
        books: [summary('ready')],
        coloring: [coloring()],
        loadBook: async () => ({ ...book(), ...changes }),
      });
      expect(round).toBeNull();
    }
  });
  it('allows a prepared coloring sheet on a vocabulary-hidden public book', async () => {
    const round = await makeFreePlayRound('coloring', {
      books: [summary('ready')],
      coloring: [coloring()],
      loadBook: async () => ({ ...book(), hideVocabulary: true }),
    });
    expect(round?.kind).toBe('coloring');
  });
  it('retains every authored hitbox but asks for only three distinct objects', () => {
    const data = {
      type: 'hidden-object',
      scenes: [
        {
          sceneImageUrl: 'scene.webp',
          targets: ['a', 'a', 'b', 'c', 'd', 'e'].map((objectName, i) => ({
            objectName,
            label: objectName,
            x: i / 10,
            y: 0.1,
            w: 0.1,
            h: 0.1,
          })),
        },
      ],
    } as HiddenObjectData;
    const easy = easyHiddenScene(data);
    const names = new Set(easy.scenes[0].targets.map((target) => target.objectName));
    expect(names.size).toBe(3);
    expect(easy.scenes[0].targets).toEqual(
      data.scenes[0].targets.filter((target) => names.has(target.objectName))
    );
    expect(data.scenes[0].targets).toHaveLength(6);
  });
  it('surfaces a network failure rather than inventing substitute content', async () => {
    await expect(
      makeFreePlayRound('blocks', {
        books: [summary('ready')],
        coloring: [coloring()],
        loadBook: async () => {
          throw new Error('offline');
        },
      })
    ).rejects.toThrow('offline');
  });
  it('keeps the classic-only random word policy while prepared art stays available', async () => {
    const sources = {
      books: [{ ...summary('ready'), category: '자연관찰' }],
      coloring: [coloring()],
      loadBook: async () => book(),
    };
    expect(await makeFreePlayRound('writing', sources)).toBeNull();
    expect(await makeFreePlayRound('blocks', sources)).toBeNull();
    expect((await makeFreePlayRound('coloring', sources))?.kind).toBe('coloring');
  });
});
