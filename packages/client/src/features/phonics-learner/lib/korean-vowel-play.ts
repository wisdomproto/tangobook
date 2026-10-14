import { KOREAN_BASIC_VOWEL_GROUPS, KOREAN_BASIC_VOWEL_LESSONS } from '@tangobook/shared';
import type { ReviewCard } from './korean-phonics-units';

/** Free exploration uses the prepared chapter pool, without claiming prior learning. */
export function freeVowelCards(unitId: string): ReviewCard[] {
  const group = KOREAN_BASIC_VOWEL_GROUPS.find((item) => item.id === unitId);
  const index = KOREAN_BASIC_VOWEL_LESSONS.findIndex((lesson) => lesson.id === unitId);
  const lessons = group
    ? group.reviewAll
      ? KOREAN_BASIC_VOWEL_LESSONS
      : group.lessons
    : index >= 0
      ? KOREAN_BASIC_VOWEL_LESSONS.slice(Math.max(0, index - 3), index + 1)
      : [];
  return lessons.map((lesson) => ({
    unitId: lesson.sourceUnitId,
    letter: lesson.vowel,
    syllable: lesson.sound,
    sound: lesson.sound,
    matchPosition: 'jung' as const,
  }));
}

/** 듣기의 실제 완료만 사용한다. 선택/방문/쓰기만으로 낯선 모음을 놀이에 넣지 않는다. */
export function learnedVowelCards(
  unitId: string,
  readDone: (id: string) => readonly string[]
): ReviewCard[] {
  const lessonIndex = KOREAN_BASIC_VOWEL_LESSONS.findIndex((lesson) => lesson.id === unitId);
  if (lessonIndex >= 0) {
    return KOREAN_BASIC_VOWEL_LESSONS.slice(0, lessonIndex + 1)
      .filter((lesson) => readDone(lesson.id).includes('listen-1'))
      .slice(-4)
      .map((lesson) => ({
        unitId: lesson.sourceUnitId,
        letter: lesson.vowel,
        syllable: lesson.sound,
        sound: lesson.sound,
        matchPosition: 'jung' as const,
      }));
  }
  const current = KOREAN_BASIC_VOWEL_GROUPS.find((group) => group.id === unitId);
  if (!current) return [];
  const groups = current.reviewAll ? KOREAN_BASIC_VOWEL_GROUPS : [current];
  return groups.flatMap((group) => {
    const done = readDone(group.id);
    return group.lessons.flatMap((lesson, index) =>
      done.includes(`listen-${index + 1}`)
        ? [
            {
              unitId: lesson.sourceUnitId,
              letter: lesson.vowel,
              syllable: lesson.sound,
              sound: lesson.sound,
              matchPosition: 'jung' as const,
            },
          ]
        : []
    );
  });
}
