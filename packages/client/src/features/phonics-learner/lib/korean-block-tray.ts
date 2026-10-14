import { KOREAN_BASIC_VOWEL_LESSONS } from '@tangobook/shared';
import { getAllKoreanUnits } from './korean-phonics-units';

export interface KoreanBlockTrayLetters {
  consonants: readonly string[];
  vowels: readonly string[];
}

const units = getAllKoreanUnits().filter(
  (unit) => unit.levelKey === 'hangul1' && !unit.isReview && unit.phonemes.length === 1
);

/** Stage order, rather than profile completion, also works when a parent chooses a free-mode lesson. */
export function getBasicConsonantBlockTray(unitId: string): KoreanBlockTrayLetters | undefined {
  const index = units.findIndex((unit) => unit.id === unitId);
  if (index < 0) return undefined;
  return {
    consonants: units.slice(0, index + 1).flatMap((unit) => unit.phonemes),
    vowels: KOREAN_BASIC_VOWEL_LESSONS.map((lesson) => lesson.vowel),
  };
}
