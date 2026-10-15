import { composeHangul, decomposeWord } from '@tangobook/shared';
import { usesWholeWordAudio } from './english-word-policy';

export interface WordBlendStep {
  parts: string[];
  result: string;
  /** Final whole word uses the authored word recording; other steps use verified phonics sounds. */
  wholeWord?: boolean;
  silentParts?: number[];
  /** Visual word chunks are not isolated phonemes; only use natural whole-word audio. */
  wholeAudioOnly?: boolean;
  /** The position within the complete Hangul word, including repeated syllables. */
  focusIndex?: number;
}

export function koreanWordBlendSteps(word: string): WordBlendStep[] {
  const syllables = decomposeWord(word);
  if (!syllables.length) return [{ parts: [...word], result: word, wholeWord: true }];
  const steps = syllables.flatMap((s, focusIndex): WordBlendStep[] => {
    const cv = composeHangul(s.cho, s.jung, null);
    return [
      { parts: [s.cho, s.jung], result: cv, focusIndex },
      ...(s.jong
        ? [{ parts: [cv, s.jong], result: composeHangul(s.cho, s.jung, s.jong), focusIndex }]
        : []),
    ];
  });
  if (syllables.length > 1) steps.push({ parts: [...word], result: word, wholeWord: true });
  else steps[steps.length - 1].wholeWord = true;
  return steps;
}

/** Keep digraphs/vowel teams as one sound unit rather than pronouncing alphabet names. */
export function englishSoundParts(text: string): string[] {
  return (
    text.match(
      /igh|tch|dge|sh|ch|th|ph|wh|qu|ck|ng|ee|ea|ai|ay|oa|ow|oo|ou|oi|oy|oe|ue|ie|au|aw|ew|ar|or|er|ir|ur|[a-z]/g
    ) ?? [text]
  );
}

/** Rime first: a+t→at, c+at→cat; i+p→ip, sh+ip→ship. */
export function englishWordBlendSteps(
  word: string,
  pattern?: string,
  alphabet = false
): WordBlendStep[] {
  const normalized = word.toLowerCase();
  // Book 1 uses a word as the meaning of its initial letter, never asks the child to decode apple.
  if (alphabet)
    return [{ parts: [normalized[0]], result: normalized, wholeWord: true, wholeAudioOnly: true }];
  if (usesWholeWordAudio(normalized))
    return [{ parts: [normalized], result: normalized, wholeWord: true, wholeAudioOnly: true }];
  const vowel = normalized.startsWith('qu')
    ? normalized.slice(2).search(/[aeiou]/) + 2
    : normalized.search(/[aeiou]/);
  if (vowel <= 0)
    return [{ parts: englishSoundParts(normalized), result: normalized, wholeWord: true }];
  const onset = normalized.slice(0, vowel);
  const rime = normalized.slice(vowel);
  if (
    (pattern?.startsWith('_') || /^[aeiou][^aeiour]e$/.test(rime)) &&
    rime.endsWith('e') &&
    rime.length > 2
  ) {
    const short = rime.slice(0, -1);
    return [
      { parts: englishSoundParts(short), result: short },
      { parts: [short, 'e'], result: rime, silentParts: [1] },
      { parts: [onset, rime], result: normalized, wholeWord: true },
    ];
  }
  // House/goose/store do not gain a new long vowel by appending e to "ous/oos/or".
  if (rime.length > 2 && rime.endsWith('e'))
    return [{ parts: [onset, rime], result: normalized, wholeWord: true }];
  const parts = englishSoundParts(rime);
  return [
    ...(parts.length > 1 ? [{ parts, result: rime }] : []),
    { parts: [onset, rime], result: normalized, wholeWord: true },
  ];
}
