import { getAllKoreanUnits, getActivityPlan, type ActivityKind } from './korean-phonics-units';
import { getAllEnglishUnits, getEnglishActivityPlan } from './english-phonics-units';
import type { JourneyLanguage } from './learning-journey';
import { wordLearningStages, type WordLearningStage } from './word-learning-run';

export const FREE_GAME_TYPES = [
  { id: 'tap', section: 'letters', art: 'letter' },
  { id: 'trace', section: 'letters', art: 'write' },
  { id: 'blend', section: 'letters', art: 'combine' },
  { id: 'syllableWrite', section: 'letters', art: 'writing.webp' },
  { id: 'find', section: 'letters', art: 'hidden.webp' },
  { id: 'listen', section: 'letters', art: 'listen' },
  { id: 'match', section: 'letters', art: 'matching.webp' },
  { id: 'song', section: 'letters', art: 'book' },
  { id: 'meet', section: 'words', art: 'book' },
  { id: 'wordMatch', section: 'words', art: 'matching.webp' },
  { id: 'block', section: 'words', art: 'blocks' },
  { id: 'listenBlock', section: 'words', art: 'blocks' },
  { id: 'wordWrite', section: 'words', art: 'writing.webp' },
  { id: 'color', section: 'words', art: 'coloring.webp' },
  { id: 'draw', section: 'words', art: 'drawing.webp' },
] as const;
export type FreeGameType = (typeof FREE_GAME_TYPES)[number];
export type FreeGameId = FreeGameType['id'];
const kinds: Partial<Record<ActivityKind, FreeGameId>> = {
  'vowel-listen': 'tap',
  'consonant-tap': 'tap',
  'alphabet-letter-learn': 'tap',
  'vowel-write': 'trace',
  'alphabet-letter-write': 'trace',
  'consonant-blend-listen': 'blend',
  'coda-blend-listen': 'blend',
  'vowel-blend-listen': 'blend',
  'cvc-pattern-learn': 'blend',
  'word-family-learn': 'blend',
  'consonant-write': 'syllableWrite',
  'vowel-blend-write': 'syllableWrite',
  'cvc-pattern-write': 'syllableWrite',
  'review-write': 'wordWrite',
  'consonant-find': 'find',
  'letter-hunt': 'find',
  'vowel-hunt': 'find',
  'vowel-listen-game': 'listen',
  'word-listen-choose': 'listen',
  'review-syllable-listen': 'listen',
  'review-word-listen': 'listen',
  'review-listen': 'listen',
  'tone-choice-review': 'listen',
  'vowel-match': 'match',
  'game-line-matching': 'wordMatch',
  'review-match': 'match',
  'review-flip': 'match',
  chant: 'song',
  'game-connect-dots': 'draw',
  'game-korean-block': 'block',
  'game-english-block': 'block',
  'game-word-writing': 'wordWrite',
};
const stageType: Record<WordLearningStage, FreeGameId> = {
  meet: 'meet',
  block: 'block',
  write: 'wordWrite',
  color: 'color',
};

/** Only real, existing plans/routes. Browsing never reads or mutates guided progress. */
export function freePlayCatalog(lang: JourneyLanguage) {
  const units = lang === 'korean' ? getAllKoreanUnits() : getAllEnglishUnits();
  return units.flatMap((unit) => {
    const activities = (
      lang === 'korean' ? getActivityPlan(unit.id) : getEnglishActivityPlan(unit.id)
    ).activities;
    const connected = activities.some((a) => a.kind === 'word-learning');
    return activities.flatMap((activity) => {
      const base = `/library/phonics/${lang}/${unit.id}/${activity.key}`;
      if (activity.kind === 'word-learning')
        return wordLearningStages(unit.id).map((stage) => ({
          unit,
          activity,
          game:
            unit.id.startsWith('en-b1') && stage === 'write'
              ? ('trace' as const)
              : stageType[stage],
          href: `${base}?part=${stage}`,
        }));
      // Connected word practice replaces these old individual menu aliases.
      if (
        connected &&
        ['game-korean-block', 'game-english-block', 'game-word-writing'].includes(activity.key)
      )
        return [];
      const game =
        unit.id.startsWith('en-b1') && activity.kind === 'review-write'
          ? 'trace'
          : activity.key.endsWith('-listen') && activity.kind.includes('block')
            ? 'listenBlock'
            : kinds[activity.kind];
      return game ? [{ unit, activity, game, href: base }] : [];
    });
  });
}
