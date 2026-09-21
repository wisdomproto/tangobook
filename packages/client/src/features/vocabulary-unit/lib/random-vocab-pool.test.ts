import { describe, expect, it } from 'vitest';
import type { VocabEntry } from '@tangobook/shared';
import { unitToEnglishBlockData, unitToKoreanBlockData } from './game-data-adapter';
import { vocabEntriesToVirtualUnit } from './random-vocab-pool';

describe('vocabEntriesToVirtualUnit', () => {
  it('keeps the selected classic storybook id through Korean and English block items', () => {
    const entry: VocabEntry = {
      word: 'hat',
      korean: '모자',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      sources: [
        {
          storybookId: 'nature-book',
          storybookTitle: '자연책',
          sourceType: 'storybook-key-object',
          imageUrl: '/nature-hat.webp',
        },
        {
          storybookId: 'classic-book',
          storybookTitle: '명작책',
          sourceType: 'storybook-key-object',
          imageUrl: '/classic-hat.webp',
          ttsUrl: '/hat.mp3',
        },
      ],
    };

    const unit = vocabEntriesToVirtualUnit([entry], 'ko', new Set(['classic-book']));

    expect(unit.words[0]).toMatchObject({
      sourceStorybookId: 'classic-book',
      images: [{ imageUrl: '/classic-hat.webp' }],
    });
    expect(unitToKoreanBlockData(unit)?.items[0]).toMatchObject({
      word: '모자',
      storybookId: 'classic-book',
    });
    expect(unitToEnglishBlockData(unit)?.items[0]).toMatchObject({
      word: 'hat',
      storybookId: 'classic-book',
    });
  });
});
