import type { EnglishBlockLetter } from '../types/storybook.js';

export const VOWELS = ['a', 'e', 'i', 'o', 'u'] as const;

export const CONSONANTS = [
  'b',
  'c',
  'd',
  'f',
  'g',
  'h',
  'j',
  'k',
  'l',
  'm',
  'n',
  'p',
  'q',
  'r',
  's',
  't',
  'v',
  'w',
  'x',
  'y',
  'z',
] as const;

const VOWEL_SET = new Set<string>(VOWELS);

export function isEnglishVowel(char: string): boolean {
  return VOWEL_SET.has(char.toLowerCase());
}

export function decomposeEnglishWord(word: string): EnglishBlockLetter[] {
  return [...word.toLowerCase()]
    .filter((ch) => /^[a-z]$/.test(ch))
    .map((ch) => ({ char: ch, isVowel: VOWEL_SET.has(ch) }));
}
