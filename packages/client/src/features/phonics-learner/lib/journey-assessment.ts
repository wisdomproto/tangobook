import type { JourneyLanguage } from './learning-journey';

export interface ChoiceEvidence {
  question: number;
  firstAttempt: boolean;
}
export interface GameObservation {
  runId: string;
  firstChoices: Record<string, { target: string; correct: boolean }>;
  retries: number;
}

function key(lang: JourneyLanguage) {
  const profile = localStorage.getItem('tangobook:activeProfileId');
  return `phonics-game-observations:${lang}${profile ? `:profile:${profile}` : ''}`;
}

/** Latest observed run per activity, never a fabricated mastery score or an unlock threshold. */
export function readGameObservations(lang: JourneyLanguage): Record<string, GameObservation> {
  try {
    const value = JSON.parse(localStorage.getItem(key(lang)) ?? '{}');
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.fromEntries(
      Object.entries(value).filter(([, run]) => {
        const observation = run as Partial<GameObservation> | null;
        return (
          observation &&
          typeof observation.runId === 'string' &&
          typeof observation.retries === 'number' &&
          observation.firstChoices &&
          typeof observation.firstChoices === 'object' &&
          !Array.isArray(observation.firstChoices) &&
          Object.values(observation.firstChoices).every(
            (choice) =>
              choice && typeof choice.target === 'string' && typeof choice.correct === 'boolean'
          )
        );
      })
    ) as Record<string, GameObservation>;
  } catch {
    return {};
  }
}

export function recordGameChoice(
  lang: JourneyLanguage,
  unitId: string,
  activityKey: string,
  runId: string,
  correct: boolean,
  target: string,
  evidence: ChoiceEvidence
) {
  try {
    const all = readGameObservations(lang);
    const id = `${unitId}/${activityKey}`;
    const previous = all[id];
    const restart = evidence.firstAttempt && evidence.question === 0 && !!previous?.firstChoices[0];
    const run: GameObservation =
      previous?.runId === runId && !restart ? previous : { runId, firstChoices: {}, retries: 0 };
    if (evidence.firstAttempt) run.firstChoices[evidence.question] = { target, correct };
    else run.retries += 1;
    all[id] = run;
    localStorage.setItem(key(lang), JSON.stringify(all));
  } catch {
    /* Storage can be disabled; it must not block the activity. */
  }
}
