import { getKoreanLearnedLetters } from '@tangobook/shared';

export interface KoreanBlockTrayLetters {
  consonants: readonly string[];
  vowels: readonly string[];
  /** Silent initial ㅇ is introduced with vowels; coda ㅇ still follows consonant lessons. */
  codaConsonants?: readonly string[];
}

/** Stage order, rather than profile completion, also works when a parent chooses a free-mode lesson. */
export function getBasicConsonantBlockTray(unitId: string): KoreanBlockTrayLetters | undefined {
  return unitId === 'kr-h1-u01' ? undefined : getKoreanLearnedLetters(unitId);
}
