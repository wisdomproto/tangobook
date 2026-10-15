import { KOREAN_BASIC_VOWEL_GROUPS, KOREAN_BASIC_VOWEL_LESSONS } from '@tangobook/shared';
import {
  getAllKoreanUnits,
  getKoreanUnit,
  getActivityPlan,
  type ActivityDef,
} from './korean-phonics-units';
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
  if (lang === 'english') return getAllEnglishUnits();
  // Guided chapters teach one vowel at a time. Free-mode grouping and authoring IDs stay compatible.
  return getAllKoreanUnits().flatMap((unit) => {
    const group = KOREAN_BASIC_VOWEL_GROUPS.find((item) => item.id === unit.id);
    return group ? group.lessons.map((lesson) => getKoreanUnit(lesson.id)!) : [unit];
  });
}

/** Old guided group links keep the exact vowel; old free links still use their original group. */
export function journeyKoreanActivityRoute(unitId: string, activityKey: string) {
  const group = KOREAN_BASIC_VOWEL_GROUPS.find((item) => item.id === unitId);
  const match = /^(listen|write)-(\d+)$/.exec(activityKey);
  if (group && match) {
    const lesson = group.lessons[Number(match[2]) - 1];
    if (lesson) return { unitId: lesson.id, activityKey: `${match[1]}-1` };
  }
  if (group && activityKey === 'listen-game')
    return { unitId: group.lessons.at(-1)!.id, activityKey };
  if (unitId === 'kr-h1-u01')
    return {
      unitId: KOREAN_BASIC_VOWEL_LESSONS[0].id,
      activityKey: activityKey === 'write-1' ? 'write-1' : 'listen-1',
    };
  return { unitId, activityKey };
}

export function journeyActivities(lang: JourneyLanguage, unitId: string): readonly ActivityDef[] {
  const plan = lang === 'korean' ? getActivityPlan(unitId) : getEnglishActivityPlan(unitId);
  return plan.activities.filter(
    (a) => a.required || a.kind === 'vowel-listen-game' || a.kind === 'word-learning'
  );
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
  const allSteps = journeySteps(lang);
  const exemptions = wordLearningLegacyChapters(lang, allSteps, readDone);
  const steps = allSteps.filter(
    (s) => s.activity.kind !== 'word-learning' || !exemptions.includes(s.unit.id)
  );
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

/** Snapshot only pre-existing chapter completion. Never mark a new activity or skill as completed. */
function wordLearningLegacyChapters(
  lang: JourneyLanguage,
  steps: ReturnType<typeof journeySteps>,
  readDone: ReadJourneyProgress
): string[] {
  let key = `phonics-word-learning-legacy:v1:${lang}`;
  try {
    key += `:${localStorage.getItem('tangobook:activeProfileId') || 'guest'}`;
    const stored = JSON.parse(localStorage.getItem(key) ?? 'null');
    if (Array.isArray(stored) && stored.every((id) => typeof id === 'string')) return stored;
    const ids = [
      ...new Set(steps.filter((s) => s.activity.kind === 'word-learning').map((s) => s.unit.id)),
    ];
    const exemptions = ids.filter((id) => {
      const done = readDone(id);
      const old = steps.filter((s) => s.unit.id === id && s.activity.kind !== 'word-learning');
      return (
        !done.includes('word-learning') &&
        old.length > 0 &&
        old.every((s) => done.includes(s.activity.key))
      );
    });
    localStorage.setItem(key, JSON.stringify(exemptions));
    legacyInMemory.set(key, exemptions);
    return exemptions;
  } catch {
    // Storage-disabled sessions retain the initial empty snapshot, so new completions cannot skip it.
    if (!legacyInMemory.has(key)) legacyInMemory.set(key, []);
    return legacyInMemory.get(key)!;
  }
}
const legacyInMemory = new Map<string, string[]>();

export function journeyActivityUrl(lang: JourneyLanguage, unitId: string, activityKey: string) {
  return `/library/phonics/${lang}/${unitId}/${activityKey}?mode=curriculum`;
}

export function journeyHomeUrl(lang: JourneyLanguage) {
  return `/library/phonics/${lang}?mode=curriculum`;
}
