import { describe, expect, it } from 'vitest';
import type { Storybook } from '@tangobook/shared';
import { getBasicConsonantBlockTray } from './korean-block-tray';
import { phonicsToKoreanBlockData } from './phonics-game-adapter';
import { charAt, trayEntriesForLetters } from '@/features/games/lib/tango-board/blocks';

const vowels = [...'ㅏㅑㅓㅕㅗㅛㅜㅠㅡㅣ'];
const consonants = [...'ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ'];
describe('basic consonant block choices', () => {
  it.each(consonants.map((_, index) => index))(
    'shows only the stage prefix for lesson %i',
    (index) => {
      const tray = getBasicConsonantBlockTray(`kr-h1-u${String(index + 2).padStart(2, '0')}`)!;
      expect(tray.consonants).toEqual(consonants.slice(0, index + 1));
      expect(tray.vowels).toEqual(vowels);
      for (const letters of [tray.consonants, tray.vowels])
        expect(
          trayEntriesForLetters(letters).map((entry) => charAt(entry.id, entry.rotDeg))
        ).toEqual(letters);
    }
  );
  it.each(['kr-v1-u01', 'kr-h1-u01', 'kr-h1-r1', 'kr-h2-u01', 'kr-h3-u01', 'kr-h4-u01', 'book-1'])(
    'keeps %s outside this lesson restriction',
    (id) => {
      expect(getBasicConsonantBlockTray(id)).toBeUndefined();
    }
  );
  it('excludes impossible words before the four-question sample is chosen', () => {
    const book = {
      id: 'kr-h1-u02',
      phonicsConfig: { targetWords: ['고기', '가구', '아기', '야구'] },
    } as unknown as Storybook;
    const tray = getBasicConsonantBlockTray(book.id)!;
    expect(
      phonicsToKoreanBlockData(book, tray)
        ?.items.map((item) => item.word)
        .sort()
    ).toEqual(['가구', '고기']);
    expect(phonicsToKoreanBlockData(book)?.items).toHaveLength(4);
    expect(
      phonicsToKoreanBlockData(
        { ...book, phonicsConfig: { ...book.phonicsConfig!, targetWords: ['아기'] } },
        tray
      )
    ).toBeNull();
  });
  it('checks vowels and coda as well as initial consonants', () => {
    const book = {
      id: 'kr-h1-u02',
      phonicsConfig: { targetWords: ['가기', '갱', '개'] },
    } as unknown as Storybook;
    expect(
      phonicsToKoreanBlockData(book, getBasicConsonantBlockTray(book.id))?.items.map(
        (item) => item.word
      )
    ).toEqual(['가기']);
  });
});
