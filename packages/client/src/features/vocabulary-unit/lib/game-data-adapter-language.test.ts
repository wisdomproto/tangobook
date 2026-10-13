import { describe, expect, it } from 'vitest';
import type { VocabularyUnit } from '@tangobook/shared';
import { unitToEnglishBlockData, unitToWordWritingData } from './game-data-adapter';
const unit = {
  id: 'book-reviewed',
  language: 'ko',
  words: [
    {
      word: 'Nabi',
      korean: '나비',
      ttsUrl: '/korean-cat.mp3',
      images: [{ imageUrl: '/cat.webp', isPrimary: true }],
    },
  ],
} as unknown as VocabularyUnit;
describe('vocabulary game narration language', () => {
  it('never attaches Korean book narration to English games', () => {
    expect(unitToEnglishBlockData(unit)!.items[0].ttsUrl).toBeUndefined();
    expect(unitToWordWritingData(unit, 'en')!.items[0].ttsUrl).toBeUndefined();
    expect(unitToWordWritingData(unit, 'ko')!.items[0].ttsUrl).toBe('/korean-cat.mp3');
  });
  it('retains explicit English narration and legacy English-unit audio', () => {
    const explicit = structuredClone(unit);
    explicit.words[0].ttsUrls = { en: '/english-nabi.mp3' };
    expect(unitToEnglishBlockData(explicit)!.items[0].ttsUrl).toBe('/english-nabi.mp3');
    const english = structuredClone(unit);
    english.language = 'en';
    english.words[0].ttsUrl = '/legacy-english.mp3';
    expect(unitToWordWritingData(english, 'en')!.items[0].ttsUrl).toBe('/legacy-english.mp3');
    expect(unitToWordWritingData(english, 'ko')!.items[0].ttsUrl).toBeUndefined();
  });
});
