import { getAllKoreanUnits, getActivityPlan, type ActivityDef } from './korean-phonics-units';
import { getAllEnglishUnits, getEnglishActivityPlan } from './english-phonics-units';
import { getUnitProgress } from './progress-store';

export type JourneyLanguage = 'korean' | 'english';

function startedKey(lang: JourneyLanguage) {
  const profile = localStorage.getItem('tangobook:activeProfileId');
  return `phonics-journey-started:${lang}${profile ? `:profile:${profile}` : ''}`;
}

/** Starting is only a resume label, never completion evidence. */
export function hasJourneyStarted(lang: JourneyLanguage) {
  try {
    return localStorage.getItem(startedKey(lang)) === '1';
  } catch {
    return false;
  }
}

export function markJourneyStarted(lang: JourneyLanguage) {
  try {
    localStorage.setItem(startedKey(lang), '1');
  } catch {
    /* no-op */
  }
}

/** Production plans remain authoritative; unavailable optional asset games are not prerequisites. */
export function journeyUnits(lang: JourneyLanguage) {
  return lang === 'korean' ? getAllKoreanUnits() : getAllEnglishUnits();
}

export function journeyActivities(lang: JourneyLanguage, unitId: string): readonly ActivityDef[] {
  const plan = lang === 'korean' ? getActivityPlan(unitId) : getEnglishActivityPlan(unitId);
  return plan.activities.filter((a) => a.required || a.kind === 'vowel-listen-game');
}

export function journeySteps(lang: JourneyLanguage) {
  return journeyUnits(lang).flatMap((unit) =>
    journeyActivities(lang, unit.id).map((activity) => ({ unit, activity }))
  );
}

export type ReadJourneyProgress = (unitId: string) => readonly string[];

export function journeyProgress(
  lang: JourneyLanguage,
  readDone: ReadJourneyProgress = (id) => getUnitProgress(lang, id).completedActivities
) {
  const steps = journeySteps(lang);
  const byUnit = new Map<string, readonly string[]>();
  const done = steps.map(({ unit, activity }) => {
    if (!byUnit.has(unit.id)) byUnit.set(unit.id, readDone(unit.id));
    return byUnit.get(unit.id)!.includes(activity.key);
  });
  const currentIndex = done.findIndex((value) => !value);
  return {
    steps,
    done,
    currentIndex,
    current: currentIndex < 0 ? undefined : steps[currentIndex],
    completed: done.filter(Boolean).length,
    finished: currentIndex < 0,
  };
}

export function journeyActivityUrl(lang: JourneyLanguage, unitId: string, activityKey: string) {
  return `/library/phonics/${lang}/${unitId}/${activityKey}?mode=curriculum`;
}

export function journeyHomeUrl(lang: JourneyLanguage) {
  return `/library/phonics/${lang}?mode=curriculum`;
}
