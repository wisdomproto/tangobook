/** Original curriculum words stay intact. These examples need natural whole-word audio. */
export const WHOLE_WORD_EXAMPLES = new Set([
  'dragon',
  'cherry',
  'photo',
  'dolphin',
  'elephant',
  'whisper',
  'peanut',
  'pillow',
  'window',
  'toilet',
  'soybean',
  'letter',
  'singer',
  'soccer',
  'teacher',
  'purple',
  'turtle',
  'farmer',
  // Their vowels cannot be read by applying a regular short-vowel/magic-e rime.
  'glove',
  'front',
  'swan',
  'wash',
]);

export function usesWholeWordAudio(word: string): boolean {
  return WHOLE_WORD_EXAMPLES.has(word.toLowerCase());
}
