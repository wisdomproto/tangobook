import type { LearningEvent, StorybookSummary } from '@tangobook/shared';
import { KOREAN_PHONICS_CURRICULUM, ENGLISH_PHONICS_CURRICULUM } from '@tangobook/shared';

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
    if (phonicsIds.has(e.storybook_id)) read.add(e.storybook_id);
  }
  return read;
}

export interface LevelProgress {
  totalUnits: number;
  readUnits: number;
  readUnitIds: string[];
}

export function koreanLevelProgress(levelId: string, readUnitIds: Set<string>): LevelProgress {
  const level = KOREAN_PHONICS_CURRICULUM.find((l) => l.level === levelId);
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
