import { getRequiredActivities } from '@/features/phonics-learner/lib/korean-phonics-units';
import { getEnglishRequiredActivities } from '@/features/phonics-learner/lib/english-phonics-units';
import type { LearningEvent, StorybookSummary } from '@tangobook/shared';
import {
  KOREAN_PHONICS_LEARNING_CURRICULUM,
  KOREAN_BASIC_VOWEL_LESSONS,
  KOREAN_BASIC_VOWEL_GROUPS,
  ENGLISH_PHONICS_CURRICULUM,
  legacyVowelActivityKeys,
  koreanVowelGroupActivityKeys,
  koreanLearningUnitId,
} from '@tangobook/shared';

/**
 * 파닉스 unit 진행률: 활성 프로필이 읽은(page_read emit된) phonics storybook의 id 집합.
 * storybook.id === unit.id 매핑 전제 (seed-phonics-books.mjs 규칙).
 */
export function readPhonicsUnitIds(
  events: LearningEvent[],
  storybooks: StorybookSummary[]
): Set<string> {
  const phonicsIds = new Set(storybooks.filter((s) => s.type === 'phonics').map((s) => s.id));
  const read = new Set<string>();
  for (const e of events) {
    if (e.event_type !== 'page_read') continue;
    if (!e.storybook_id) continue;
    if (phonicsIds.has(e.storybook_id)) read.add(koreanLearningUnitId(e.storybook_id));
    else if (
      e.metadata?.source === 'phonics' &&
      e.metadata.lang === 'ko' &&
      [...KOREAN_BASIC_VOWEL_LESSONS, ...KOREAN_BASIC_VOWEL_GROUPS].some(
        (lesson) => lesson.id === e.metadata?.unitId
      )
    )
      read.add(koreanLearningUnitId(e.metadata.unitId!));
  }
  return read;
}

export interface LevelProgress {
  totalUnits: number;
  readUnits: number;
  readUnitIds: string[];
}

export function koreanLevelProgress(levelId: string, readUnitIds: Set<string>): LevelProgress {
  const level = KOREAN_PHONICS_LEARNING_CURRICULUM.find((l) => l.level === levelId);
  const units = level?.units ?? [];
  const readList = units.filter((u) => readUnitIds.has(u.id)).map((u) => u.id);
  return { totalUnits: units.length, readUnits: readList.length, readUnitIds: readList };
}

export function englishBookProgress(bookId: string, readUnitIds: Set<string>): LevelProgress {
  const book = ENGLISH_PHONICS_CURRICULUM.find((b) => b.level === bookId);
  const units = book?.units ?? [];
  const readList = units.filter((u) => readUnitIds.has(u.id)).map((u) => u.id);
  return { totalUnits: units.length, readUnits: readList.length, readUnitIds: readList };
}

/** 해당 phonics storybook 전체 중 '비어있지 않은' (컨텐츠가 있는) 것의 수. 추후 확장용. */
export function countPhonicsBooksByLanguage(
  storybooks: StorybookSummary[],
  language: 'korean' | 'english'
): number {
  return storybooks.filter((s) => s.type === 'phonics' && s.phonicsLanguage === language).length;
}

/** A visit is not completion. Only recorded completion of every required activity qualifies. */
export function completedPhonicsUnitIds(events: LearningEvent[], lang: 'ko' | 'en'): Set<string> {
  const activities = new Map<string, Set<string>>();
  for (const event of events) {
    const meta = event.metadata;
    if (
      meta?.source !== 'phonics' ||
      meta.lang !== lang ||
      !meta.activityCompleted ||
      !meta.activityId ||
      !meta.unitId
    )
      continue;
    const done = activities.get(meta.unitId) ?? new Set<string>();
    done.add(meta.activityId);
    activities.set(meta.unitId, done);
  }
  const completed = new Set<string>();
  if (lang === 'ko') {
    const legacy = [...(activities.get('kr-h1-u01') ?? [])];
    for (const lesson of KOREAN_BASIC_VOWEL_LESSONS) {
      const done = activities.get(lesson.id) ?? new Set<string>();
      legacyVowelActivityKeys(lesson.id, legacy).forEach((key) => done.add(key));
      if (done.size) activities.set(lesson.id, done);
    }
    for (const group of KOREAN_BASIC_VOWEL_GROUPS) {
      activities.set(
        group.id,
        new Set(koreanVowelGroupActivityKeys(group.id, (id) => [...(activities.get(id) ?? [])]))
      );
    }
  }
  for (const [unitId, done] of activities) {
    const required =
      lang === 'ko' ? getRequiredActivities(unitId) : getEnglishRequiredActivities(unitId);
    if (required.length && required.every((activity) => done.has(activity))) completed.add(unitId);
  }
  return completed;
}
