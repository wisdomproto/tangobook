import type { ActivityDef } from './korean-phonics-units';

/** One free-mode entry, with the original completion keys retained for both phases. */
export function freeWritingCompanion(activities: readonly ActivityDef[], activityKey: string) {
  const learn = activities.find((activity) => activity.key === activityKey);
  if (!learn || learn.section !== 'learn') return undefined;
  const letters = (activity: ActivityDef) => activity.vowels?.map((v) => v.vowel).join('|');
  return activities.find((write) => {
    if (write.section !== 'learn') return false;
    if (learn.kind === 'vowel-listen')
      return write.kind === 'vowel-write' && letters(write) === letters(learn);
    if (learn.kind === 'consonant-tap')
      return write.kind === 'vowel-write' && letters(write) === learn.consonant;
    if (learn.kind === 'consonant-blend-listen')
      return write.kind === 'consonant-write' && write.consonant === learn.consonant;
    if (learn.kind === 'vowel-blend-listen')
      return write.kind === 'vowel-blend-write' && letters(write) === letters(learn);
    if (learn.kind === 'alphabet-letter-learn')
      return (
        write.kind === 'alphabet-letter-write' &&
        write.letters?.join('|') === learn.letters?.join('|')
      );
    return false;
  });
}

export function freeActivityGroups(activities: readonly ActivityDef[]) {
  const writingKeys = new Set(
    activities.flatMap((activity) => {
      const write = freeWritingCompanion(activities, activity.key);
      return write ? [write.key] : [];
    })
  );
  return activities
    .filter(
      (a) =>
        !activities.some((item) => item.kind === 'word-learning') ||
        !['game-dots', 'game-korean-block', 'game-english-block', 'game-word-writing'].includes(
          a.key
        )
    )
    .filter((activity) => !writingKeys.has(activity.key))
    .map((activity) => {
      const write = freeWritingCompanion(activities, activity.key);
      return { activity, keys: write ? [activity.key, write.key] : [activity.key] };
    });
}
