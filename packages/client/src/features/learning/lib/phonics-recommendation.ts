import { phonicsTargets, type WordLearning, type PhonicsTarget } from './word-learning';

export interface PhonicsRecommendation {
  word: WordLearning;
  target: PhonicsTarget;
  reason: 'needs-review' | 'not-practiced';
}

/** Recorded evidence, never a claim of mastery or a diagnosis of language ability. */
export function recommendPhonics(
  words: WordLearning[],
  now = Date.now()
): PhonicsRecommendation | null {
  const candidates = words.flatMap<PhonicsRecommendation & { score: number }>((word) => {
    const target = phonicsTargets(word.word, word.lang)[0];
    if (!target) return [];
    // Compare results within the SAME skill. Writing completion cannot establish reading.
    const weakSkills = (['building', 'meaning', 'sound'] as const).flatMap((skill) => {
      const trials = word.events
        .filter(
          (event) =>
            (event.event_type === 'word_correct' || event.event_type === 'word_wrong') &&
            event.metadata?.skill === skill &&
            event.metadata.evidence === 'first-attempt' &&
            event.metadata.firstAttempt === true &&
            Date.parse(event.created_at) <= now &&
            Date.parse(event.created_at) >= now - 14 * 86400000
        )
        .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
        .slice(0, 5);
      // Two recent successes outweigh earlier misses in this small evidence window.
      if (
        trials.slice(0, 2).length === 2 &&
        trials.slice(0, 2).every((e) => e.event_type === 'word_correct')
      )
        return [];
      const wrong = trials.filter((e) => e.event_type === 'word_wrong').length;
      return wrong >= 2 && wrong / trials.length >= 0.5 ? [wrong / trials.length] : [];
    });
    if (weakSkills.length)
      return [{ word, target, reason: 'needs-review' as const, score: Math.max(...weakSkills) }];
    if (!word.phonicsPractices && (word.exposures > 0 || word.practices > 0))
      return [{ word, target, reason: 'not-practiced' as const, score: 0 }];
    return [];
  });
  candidates.sort(
    (a, b) =>
      b.score - a.score ||
      Date.parse(b.word.lastAt) - Date.parse(a.word.lastAt) ||
      a.word.key.localeCompare(b.word.key)
  );
  return candidates[0] ?? null;
}
