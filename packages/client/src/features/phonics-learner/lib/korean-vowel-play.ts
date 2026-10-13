import { KOREAN_BASIC_VOWEL_GROUPS } from '@tangobook/shared';
import type { ReviewCard } from './korean-phonics-units';

/** 듣기의 실제 완료만 사용한다. 선택/방문/쓰기만으로 낯선 모음을 놀이에 넣지 않는다. */
export function learnedVowelCards(
  unitId: string,
  readDone: (id: string) => readonly string[]
): ReviewCard[] {
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
