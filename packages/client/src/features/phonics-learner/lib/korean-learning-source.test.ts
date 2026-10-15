import { describe, expect, it } from 'vitest';
import {
  KOREAN_PHONICS_CURRICULUM,
  KOREAN_PHONICS_LEARNING_CURRICULUM,
  getKoreanLearnedLetters,
  isKoreanWordInScope,
  type Storybook,
} from '@tangobook/shared';
import { withKoreanLearningScope } from './korean-learning-source';
import { phonicsToKoreanBlockData } from './phonics-game-adapter';
import { getKoreanUnit } from './korean-phonics-units';

describe('strict Korean chapter scope', () => {
  it('introduces silent initial ㅇ without unlocking coda or future consonants', () => {
    expect(isKoreanWordInScope('kr-h1-u02', '아기')).toBe(true);
    expect(isKoreanWordInScope('kr-h1-u02', '야구')).toBe(true);
    expect(isKoreanWordInScope('kr-h1-u02', '강')).toBe(false);
    expect(isKoreanWordInScope('kr-h1-u04', '도마')).toBe(false);
    expect(isKoreanWordInScope('kr-h1-u06', '도마')).toBe(true);
    expect(isKoreanWordInScope('kr-h1-u08', '사자')).toBe(false);
    expect(isKoreanWordInScope('kr-h1-u09', '우주')).toBe(false);
    expect(isKoreanWordInScope('kr-h1-u13', '하트')).toBe(false);
    expect(isKoreanWordInScope('kr-h3-u03', '빨래')).toBe(false);
    expect(isKoreanWordInScope('kr-h3-u04', '새싹')).toBe(false);
    expect(isKoreanWordInScope('kr-h3-u04', '썰매')).toBe(false);
    expect(isKoreanWordInScope('kr-h4-u01', '빨래')).toBe(true);
  });
  it('corrects compound vowel chapters to match their actual target words', () => {
    expect(getKoreanUnit('kr-h4-u02')?.phonemes).toEqual(['ㅒ', 'ㅖ']);
    expect(getKoreanUnit('kr-h4-u03')?.phonemes).toEqual(['ㅚ', 'ㅟ']);
    expect(isKoreanWordInScope('kr-h4-u02', '얘기')).toBe(true);
    expect(isKoreanWordInScope('kr-h4-u02', '참외')).toBe(false);
    expect(isKoreanWordInScope('kr-h4-u03', '참외')).toBe(true);
    expect(isKoreanWordInScope('kr-h4-u03', '의자')).toBe(false);
  });
  for (const level of KOREAN_PHONICS_LEARNING_CURRICULUM) {
    for (const unit of level.units.filter((u) => u.sampleWords.length)) {
      it(`${unit.id}: every retained target has all its block stages using only learned letters`, () => {
        for (const word of unit.sampleWords) {
          expect(isKoreanWordInScope(unit.id, word), word).toBe(true);
          const source = { id: unit.id, phonicsConfig: { targetWords: [word] } } as Storybook;
          expect(
            phonicsToKoreanBlockData(source, getKoreanLearnedLetters(unit.id))?.items.map(
              (i) => i.word
            )
          ).toEqual([word]);
        }
      });
    }
  }
  it('projects old source config, flashcards and families without mutating story assets or recordings', () => {
    const book = {
      id: 'kr-h1-u04',
      pages: [{ text: '도마도 있어요' }],
      phonicsConfig: { targetWords: ['두유', '도마', '기도', '구두'] },
      flashcards: [
        { word: '도마', imageUrl: 'old.png' },
        { word: '두유', imageUrl: 'milk.png' },
      ],
      phonicsLesson: {
        wordFamilies: [
          { pattern: '다', words: [{ word: '도마' }, { word: '두유', ttsUrl: 'milk.mp3' }] },
        ],
      },
    } as Storybook;
    const result = withKoreanLearningScope(book)!;
    expect(result.phonicsConfig?.targetWords).toEqual(['두유', '기도', '구두']);
    expect(result.flashcards?.map((c) => c.word)).toEqual(['두유']);
    expect(result.phonicsLesson?.wordFamilies[0].words).toEqual([
      { word: '두유', ttsUrl: 'milk.mp3' },
    ]);
    expect(result.pages).toBe(book.pages);
    expect(book.phonicsConfig?.targetWords).toContain('도마');
    expect(withKoreanLearningScope(book)).toBe(result);
  });
  it('preserves original English targets including dragon and authoring/story sources', () => {
    const english = { id: 'en-b4-u04', phonicsConfig: { targetWords: ['dragon'] } } as Storybook;
    expect(withKoreanLearningScope(english)).toBe(english);
    expect(
      KOREAN_PHONICS_CURRICULUM[0].units.find((u) => u.id === 'kr-h1-u04')?.sampleWords
    ).toContain('도마');
  });
});
