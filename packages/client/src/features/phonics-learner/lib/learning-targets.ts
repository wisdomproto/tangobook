import type { Storybook } from '@tangobook/shared';

/** Reviewed exclusions also apply to older published books until their content is revised. */
export function isLearningTarget(unitId: string, word: string): boolean {
  return !(unitId === 'en-b4-u04' && word.trim().toLowerCase() === 'dragon');
}

export function withLearningTargets(book: Storybook | undefined): Storybook | undefined {
  if (!book || book.id !== 'en-b4-u04') return book;
  const keep = (word: string) => isLearningTarget(book.id, word);
  return {
    ...book,
    ...(book.phonicsConfig && {
      phonicsConfig: {
        ...book.phonicsConfig,
        targetWords: book.phonicsConfig.targetWords.filter(keep),
      },
    }),
    ...(book.phonicsLesson && {
      phonicsLesson: {
        ...book.phonicsLesson,
        wordFamilies: book.phonicsLesson.wordFamilies.map((family) => ({
          ...family,
          words: family.words.filter((item) => keep(item.word)),
        })),
      },
    }),
    flashcards: book.flashcards?.filter((item) => keep(item.word)),
  };
}
