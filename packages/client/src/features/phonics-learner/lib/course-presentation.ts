import { getEnglishUnit, type EnglishUnitSummary } from './english-phonics-units';
import type { KoreanUnitSummary } from './korean-phonics-units';
import type { ActivityDef } from './korean-phonics-units';

export type CourseActivityMode = 'learn' | 'listen' | 'write' | 'find' | 'match' | 'draw' | 'build';

export function courseActivityMode(kind: ActivityDef['kind']): CourseActivityMode {
  if (kind.includes('write') || kind === 'game-word-writing') return 'write';
  if (kind === 'game-connect-dots') return 'draw';
  if (kind.includes('block')) return 'build';
  if (kind === 'letter-hunt') return 'find';
  if (kind.includes('match') || kind === 'review-flip') return 'match';
  if (kind.includes('listen') || kind === 'word-listen-choose' || kind === 'tone-choice-review')
    return 'listen';
  return 'learn';
}

export function letterPair(letter: string): string {
  return /^[a-z]$/i.test(letter) ? `${letter.toUpperCase()}${letter.toLowerCase()}` : letter;
}

/** 판정·오디오용 값을 바꾸지 않고 현재 활동에서 보여줄 글자만 가져온다. */
export function courseActivityPreview(activity: ActivityDef): string[] {
  if (activity.letters) return activity.letters.map(letterPair);
  if (activity.vowels) {
    return activity.vowels.map((item) =>
      courseActivityMode(activity.kind) === 'write'
        ? (item.writeLetter ?? item.syllable)
        : item.vowel
    );
  }
  if (activity.cvcPattern) return [activity.cvcPattern.vc];
  if (activity.pattern) return [activity.pattern];
  if (activity.coda) return [activity.coda];
  if (activity.consonant) return [activity.consonant];
  if (activity.reviewCards) return activity.reviewCards.map((item) => item.letter);
  return [];
}

/** Book 1의 분류명(initial sounds), 복습의 음소명(long-a)을 글자로 노출하지 않는다. */
export function courseUnitPreview(unit: KoreanUnitSummary | EnglishUnitSummary): string[] {
  const raw =
    'patterns' in unit && unit.levelIndex > 1
      ? unit.isReview
        ? (unit.coveredUnitIds ?? []).flatMap((id) => getEnglishUnit(id)?.patterns ?? [])
        : unit.patterns
      : unit.phonemes;
  return [...new Set(raw)].map((letter) => letterPair(letter.replace(/^받침/, '')));
}
