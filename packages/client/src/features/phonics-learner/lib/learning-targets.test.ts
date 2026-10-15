import { describe, expect, it } from 'vitest';
import { ENGLISH_PHONICS_CURRICULUM, type Storybook } from '@tangobook/shared';
import { isLearningTarget, withLearningTargets } from './learning-targets';
import { pickWord } from '../hooks/useReviewCardSources';

describe('reviewed phonics targets', () => {
  const book = {
    id: 'en-b4-u04',
    phonicsConfig: { targetWords: ['dragon', 'dress', 'drum'] },
    phonicsLesson: { wordFamilies: [{ words: [{ word: 'dragon' }, { word: 'drum' }] }] },
    flashcards: [
      { word: 'dragon', imageUrl: '/dragon.webp' },
      { word: 'drum', imageUrl: '/drum.webp' },
    ],
  } as Storybook;
  it('removes dragon from curriculum and every learning source in an old published book', () => {
    expect(
      ENGLISH_PHONICS_CURRICULUM.find((l) => l.level === 'book4')?.units.find(
        (u) => u.id === book.id
      )?.sampleWords
    ).not.toContain('dragon');
    const filtered = withLearningTargets(book)!;
    expect(filtered.phonicsConfig?.targetWords).toEqual(['dress', 'drum']);
    expect(filtered.phonicsLesson?.wordFamilies[0].words.map((w) => w.word)).toEqual(['drum']);
    expect(filtered.flashcards?.map((w) => w.word)).toEqual(['drum']);
    expect(book.phonicsConfig?.targetWords).toContain('dragon');
  });
  it('cannot reintroduce it through a review representative, while keeping other books unchanged', () => {
    expect(
      pickWord(
        book,
        { unitId: book.id, letter: 'dr', syllable: 'dr', sound: 'dr', matchPosition: 'cho' },
        [],
        () => 0
      ).word
    ).toBe('drum');
    expect(isLearningTarget(book.id, ' Dragon ')).toBe(false);
    const story = { ...book, id: 'a-story-about-dragons' };
    expect(withLearningTargets(story)).toBe(story);
  });
});
