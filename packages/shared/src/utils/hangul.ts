import type { KoreanBlockSyllable } from '../types/storybook.js';

const HANGUL_START = 0xac00;
const HANGUL_END = 0xd7a3;

export const CHOSUNG = [
  'ㄱ',
  'ㄲ',
  'ㄴ',
  'ㄷ',
  'ㄸ',
  'ㄹ',
  'ㅁ',
  'ㅂ',
  'ㅃ',
  'ㅅ',
  'ㅆ',
  'ㅇ',
  'ㅈ',
  'ㅉ',
  'ㅊ',
  'ㅋ',
  'ㅌ',
  'ㅍ',
  'ㅎ',
] as const;

export const JUNGSUNG = [
  'ㅏ',
  'ㅐ',
  'ㅑ',
  'ㅒ',
  'ㅓ',
  'ㅔ',
  'ㅕ',
  'ㅖ',
  'ㅗ',
  'ㅘ',
  'ㅙ',
  'ㅚ',
  'ㅛ',
  'ㅜ',
  'ㅝ',
  'ㅞ',
  'ㅟ',
  'ㅠ',
  'ㅡ',
  'ㅢ',
  'ㅣ',
] as const;

export const JONGSUNG = [
  null,
  'ㄱ',
  'ㄲ',
  'ㄳ',
  'ㄴ',
  'ㄵ',
  'ㄶ',
  'ㄷ',
  'ㄹ',
  'ㄺ',
  'ㄻ',
  'ㄼ',
  'ㄽ',
  'ㄾ',
  'ㄿ',
  'ㅀ',
  'ㅁ',
  'ㅂ',
  'ㅄ',
  'ㅅ',
  'ㅆ',
  'ㅇ',
  'ㅈ',
  'ㅊ',
  'ㅋ',
  'ㅌ',
  'ㅍ',
  'ㅎ',
] as const;

export function isHangulSyllable(char: string): boolean {
  const code = char.charCodeAt(0);
  return code >= HANGUL_START && code <= HANGUL_END;
}

export function decomposeHangul(char: string): { cho: string; jung: string; jong: string | null } {
  const code = char.charCodeAt(0) - HANGUL_START;
  const choIdx = Math.floor(code / (21 * 28));
  const jungIdx = Math.floor((code % (21 * 28)) / 28);
  const jongIdx = code % 28;
  return {
    cho: CHOSUNG[choIdx],
    jung: JUNGSUNG[jungIdx],
    jong: JONGSUNG[jongIdx],
  };
}

export function composeHangul(cho: string, jung: string, jong: string | null): string {
  const choIdx = CHOSUNG.indexOf(cho as (typeof CHOSUNG)[number]);
  const jungIdx = JUNGSUNG.indexOf(jung as (typeof JUNGSUNG)[number]);
  const jongIdx = jong ? JONGSUNG.indexOf(jong as (typeof JONGSUNG)[number]) : 0;
  if (choIdx < 0 || jungIdx < 0 || jongIdx < 0) return '';
  return String.fromCharCode(HANGUL_START + choIdx * 21 * 28 + jungIdx * 28 + jongIdx);
}

export function decomposeWord(word: string): KoreanBlockSyllable[] {
  const syllables: KoreanBlockSyllable[] = [];
  for (const char of word) {
    if (!isHangulSyllable(char)) continue;
    const { cho, jung, jong } = decomposeHangul(char);
    syllables.push({ char, cho, jung, jong });
  }
  return syllables;
}
