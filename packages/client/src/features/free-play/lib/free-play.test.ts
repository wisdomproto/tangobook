import { describe, expect, it, vi } from 'vitest';
import type {
  ColoringCatalogEntry,
  HiddenObjectData,
  Storybook,
  StorybookSummary,
} from '@tangobook/shared';
import {
  easyHiddenScene,
  isEasyPlayWord,
  isEasyEnglishPlayWord,
  makeFreePlayRound,
} from './free-play';

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

describe('English standalone practice', () => {
  const englishBook = () => {
    const result = book();
    result.key_objects!.forEach((object, i) => {
      object.nameEn = ['tree', 'baby', 'bag', 'magpie', 'cat'][i];
      object.ttsUrls = { en: `${object.nameEn}-en.mp3` };
    });
    return result;
  };
  const sources = () => ({
    books: [summary('ready')],
    coloring: [coloring()],
    loadBook: async () => englishBook(),
  });
  it.each(['cat', 'Tree', 'dog', 'sun', 'book'])('allows a short illustrated word: %s', (word) => {
    expect(isEasyEnglishPlayWord(word)).toBe(true);
  });
  it.each(['a', 'dragon', 'ice cream', 'dopo', '아기', ''])(
    'does not call %s an easy English word',
    (word) => {
      expect(isEasyEnglishPlayWord(word)).toBe(false);
    }
  );
  it.each(['blocks', 'writing'] as const)(
    '%s uses English words, English audio and the existing English data type',
    async (kind) => {
      const round = await makeFreePlayRound(kind, sources(), 'en');
      if (!round || !('data' in round) || !('items' in round.data))
        throw new Error('missing English round');
      expect(round.data.type).toBe(kind === 'blocks' ? 'english-block' : 'english-word-writing');
      expect(round.data.items).toHaveLength(3);
      expect(
        round.data.items.every(
          (item) => isEasyEnglishPlayWord(item.word) && item.ttsUrl === `${item.word}-en.mp3`
        )
      ).toBe(true);
      expect(round.bookId).toBe('ready');
    }
  );
  it('maps a Korean illustration to the matching English label and audio', async () => {
    const round = await makeFreePlayRound('coloring', sources(), 'en');
    expect(round).toMatchObject({
      kind: 'coloring',
      bookId: 'ready',
      entry: { word: 'tree', lineartUrl: 'outline.webp' },
      ttsUrl: 'tree-en.mp3',
    });
  });
  it('skips missing translations instead of showing Korean words or using Korean audio', async () => {
    for (const kind of ['blocks', 'writing', 'coloring'] as const) {
      expect(
        await makeFreePlayRound(kind, { ...sources(), loadBook: async () => book() }, 'en')
      ).toBeNull();
    }
    const noAudio = englishBook();
    noAudio.key_objects!.forEach((object) => {
      object.ttsUrls = {};
    });
    const round = await makeFreePlayRound(
      'writing',
      { ...sources(), loadBook: async () => noAudio },
      'en'
    );
    if (!round || round.kind !== 'writing') throw new Error('missing round');
    expect(round.data.items.every((item) => !item.ttsUrl)).toBe(true);
  });
  it('builds translated hidden targets while preserving canonical names and every box', async () => {
    const source = englishBook();
    source.hiddenObjectScenes = [
      {
        id: 'hobj_scene',
        sceneImageUrl: 'scene.webp',
        hotspots: ['나무', '나무', '아기', '번역없음'].map((objectName, i) => ({
          objectName,
          x: i / 10,
          y: 0,
          w: 0.1,
          h: 0.1,
        })),
      },
    ];
    const input = {
      ...sources(),
      hidden: [
        {
          key: 'scene',
          bookId: 'ready',
          bookTitle: '놀이 책',
          category: '세계 명작',
          sceneImageUrl: 'scene.webp',
          words: ['나무', '아기', '번역없음'],
        },
      ],
      loadBook: async () => source,
    };
    const round = await makeFreePlayRound('hidden-object', input, 'en');
    if (!round || round.kind !== 'hidden-object') throw new Error('missing hidden round');
    expect(round.data.scenes[0].targets.map((target) => target.label)).toEqual([
      'tree',
      'tree',
      'baby',
    ]);
    expect(round.data.scenes[0].targets[0]).toMatchObject({
      objectName: '나무',
      x: 0,
      ttsUrl: 'tree-en.mp3',
    });
    source.key_objects![1].nameEn = '';
    expect(await makeFreePlayRound('hidden-object', input, 'en')).toBeNull();
  });
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
