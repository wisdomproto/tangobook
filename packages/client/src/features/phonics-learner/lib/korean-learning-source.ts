import {
  KOREAN_PHONICS_LEARNING_CURRICULUM,
  isKoreanWordInScope,
  type Storybook,
} from '@tangobook/shared';

const units = new Map(
  KOREAN_PHONICS_LEARNING_CURRICULUM.flatMap((level) =>
    level.units.map((unit) => [unit.id, unit] as const)
  )
);
const cache = new WeakMap<Storybook, Storybook>();

/** A read-only learner projection: old published sources cannot reintroduce future Korean letters. */
export function withKoreanLearningScope(book: Storybook | undefined): Storybook | undefined {
  if (!book) return book;
  const unit = units.get(book.id);
  if (!unit || !book.phonicsConfig) return book;
  const existing = cache.get(book);
  if (existing) return existing;
  const allowed = new Set<string>(unit.sampleWords);
  const accepts = (word: string) => allowed.has(word) && isKoreanWordInScope(book.id, word);
  const result: Storybook = {
    ...book,
    phonicsConfig: {
      ...book.phonicsConfig,
      targetPhonemes: [...unit.phonemes],
      targetWords: book.phonicsConfig.targetWords.filter(accepts),
    },
    flashcards: book.flashcards?.filter((card) => accepts(card.word)),
    ...(book.phonicsLesson
      ? {
          phonicsLesson: {
            ...book.phonicsLesson,
            wordFamilies: book.phonicsLesson.wordFamilies?.map((family) => ({
              ...family,
              words: family.words.filter((word) => accepts(word.word)),
            })),
          },
        }
      : {}),
  };
  cache.set(book, result);
  return result;
}
