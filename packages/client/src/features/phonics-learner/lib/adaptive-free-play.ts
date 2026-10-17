import type { LearningEventInsert } from '@tangobook/shared';
import type { JourneyLanguage } from './learning-journey';
import { freePlayCatalog, type FreeGameId } from './free-play-catalog';
export type PlaySupport = 'model' | 'first' | 'listen';

/** Transparent practice rules, not a proficiency score. Completion never implies independent reading. */
export function chooseAdaptiveFreePlay(
  lang: JourneyLanguage,
  game: FreeGameId,
  events: LearningEventInsert[],
  random = Math.random,
  completedUnits: string[] = []
) {
  const kind = game === 'block' ? 'listenBlock' : game;
  const entries = freePlayCatalog(lang)
    .filter((entry) => entry.game === kind && !entry.unit.isReview)
    .sort(
      (a, b) =>
        a.unit.levelIndex - b.unit.levelIndex || a.unit.unitIndexInLevel - b.unit.unitIndexInLevel
    );
  if (!entries.length) return undefined;
  const units = [...new Map(entries.map((entry) => [entry.unit.id, entry.unit])).values()];
  const ids = new Set(units.map((unit) => unit.id));
  const code = lang === 'korean' ? 'ko' : 'en';
  const byId = new Map<string, LearningEventInsert>();
  events.forEach((event, index) => byId.set(event.id || `local-${index}`, event));
  const history = [...byId.values()]
    .filter(
      (event) =>
        event.metadata?.lang === code &&
        ids.has(event.metadata?.unitId || event.storybook_id || '') &&
        (event.metadata?.source === 'phonics' ||
          event.storybook_id?.startsWith(lang === 'korean' ? 'kr-' : 'en-'))
    )
    .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  const unitOf = (event: LearningEventInsert) => event.metadata?.unitId || event.storybook_id || '';
  const trained = new Set(completedUnits);
  for (const event of history)
    if (
      event.metadata?.practiceCompleted ||
      event.metadata?.activityCompleted ||
      event.metadata?.firstAttempt
    )
      trained.add(unitOf(event));
  let frontier = Math.max(0, ...units.map((unit, index) => (trained.has(unit.id) ? index : 0)));
  const skillEvents = history.filter((event) =>
    game === 'block'
      ? event.game_type?.includes('block') ||
        event.metadata?.skill === 'building' ||
        (event.metadata?.skill === 'sound' && event.metadata?.learningMode === 'assessment')
      : game === 'wordWrite'
        ? event.metadata?.skill === 'tracing'
        : event.metadata?.skill === 'meaning'
  );
  const current = skillEvents.filter((event) => unitOf(event) === units[frontier].id).slice(0, 8);
  const independent = current.filter(
    (event) =>
      event.event_type === 'word_correct' &&
      event.metadata?.independent === true &&
      event.metadata.firstAttempt === true &&
      event.metadata.modelVisible === false &&
      !event.metadata.hintUsed
  );
  // Advance at most one nearby unit after repeated unaided answers across at least two target words.
  if (
    independent.length >= 3 &&
    new Set(independent.map((event) => event.word)).size >= 2 &&
    !current.slice(0, 2).some((event) => event.event_type === 'word_wrong')
  )
    frontier = Math.min(frontier + 1, units.length - 1);
  const recent = skillEvents.slice(0, 2);
  const needsHelp =
    recent.length === 2 && recent.every((event) => event.event_type === 'word_wrong');
  const weak = needsHelp ? units.findIndex((unit) => unit.id === unitOf(recent[0])) : -1;
  const pool =
    weak >= 0
      ? entries.filter((entry) => entry.unit.id === units[weak].id)
      : entries.filter((entry) =>
          units
            .slice(Math.max(0, frontier - 1), frontier + 1)
            .some((unit) => unit.id === entry.unit.id)
        );
  const entry = pool[Math.min(pool.length - 1, Math.floor(Math.max(0, random()) * pool.length))];
  const evidence = skillEvents.filter((event) => unitOf(event) === entry.unit.id).slice(0, 8);
  const correct = evidence.filter((event) => event.event_type === 'word_correct');
  const unaided = correct.filter(
    (event) =>
      event.metadata?.independent === true &&
      event.metadata.firstAttempt === true &&
      event.metadata.modelVisible === false &&
      !event.metadata.hintUsed
  );
  const practice = history.filter(
    (event) =>
      unitOf(event) === entry.unit.id &&
      event.metadata?.practiceCompleted &&
      (game === 'wordWrite'
        ? event.metadata.skill === 'tracing'
        : event.metadata.practiceStage === 'block')
  );
  const support: PlaySupport = needsHelp
    ? 'model'
    : unaided.length >= 3 ||
        (correct.length >= 6 && new Set(correct.map((event) => event.word)).size >= 2)
      ? 'listen'
      : new Set([...correct, ...practice]).size >= 3
        ? 'first'
        : 'model';
  // Tracing is still guided practice. Blank dictation awaits handwriting recognition validation.
  const effectiveSupport = game === 'wordWrite' && support === 'listen' ? 'first' : support;
  return {
    unitId: entry.unit.id,
    support: effectiveSupport,
    href: `${entry.href}${entry.href.includes('?') ? '&' : '?'}freePlay=1&support=${effectiveSupport}`,
  };
}
