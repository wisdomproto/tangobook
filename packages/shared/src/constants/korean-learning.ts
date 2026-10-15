import { KOREAN_PHONICS_CURRICULUM } from './index.js';
import { decomposeHangul, isHangulSyllable } from '../utils/hangul.js';

export interface KoreanLearnedLetters {
  consonants: readonly string[];
  vowels: readonly string[];
  codaConsonants: readonly string[];
}

/** Cumulative chapter scope. Silent initial ㅇ is not permission to use coda ㅇ. */
export function getKoreanLearnedLetters(unitId: string): KoreanLearnedLetters | undefined {
  const consonants = new Set<string>();
  const vowels = new Set<string>();
  const codaConsonants = new Set<string>();
  for (const level of KOREAN_PHONICS_CURRICULUM) {
    for (const unit of level.units) {
      for (const letter of unit.phonemes) {
        if (letter.startsWith('받침')) codaConsonants.add(letter.replace('받침', ''));
        else if (/^[ㅏ-ㅣ]$/.test(letter)) vowels.add(letter);
        else consonants.add(letter);
      }
      if (unit.id === unitId)
        return {
          consonants: [...new Set([...consonants, 'ㅇ'])],
          vowels: [...vowels],
          codaConsonants: [...codaConsonants],
        };
    }
  }
  return undefined;
}

/** No future initial, vowel, or coda in Korean targets, even in free mode. */
export function isKoreanWordInScope(unitId: string, word: string): boolean {
  const scope = getKoreanLearnedLetters(unitId);
  return (
    !!scope &&
    word.length > 0 &&
    [...word].every((char) => {
      if (!isHangulSyllable(char)) return false;
      const { cho, jung, jong } = decomposeHangul(char);
      return (
        scope.consonants.includes(cho) &&
        scope.vowels.includes(jung) &&
        (!jong || scope.codaConsonants.includes(jong))
      );
    })
  );
}

/** 학습 권 순서와 저장된 저작 책 ID를 분리한다. 기존 R2 책/단원 ID는 유지한다. */
export const KOREAN_BASIC_VOWEL_LESSONS = [
  ['ㅏ', '아'],
  ['ㅑ', '야'],
  ['ㅓ', '어'],
  ['ㅕ', '여'],
  ['ㅗ', '오'],
  ['ㅛ', '요'],
  ['ㅜ', '우'],
  ['ㅠ', '유'],
  ['ㅡ', '으'],
  ['ㅣ', '이'],
].map(([vowel, sound], index) => ({
  id: `kr-v1-u${String(index + 1).padStart(2, '0')}`,
  title: `${vowel} 배우기`,
  vowel,
  sound,
  sourceUnitId: 'kr-h1-u01',
  legacyListenKey: index < 6 ? 'listen-1' : 'listen-2',
  phonemes: [vowel],
  patterns: ['모음'],
  sampleWords: [] as string[],
  blending: [] as string[][],
}));

const TITLES = ['자음과 기본 음절', '받침', '쌍자음', '복잡한 모음'];

/** 새 ID를 사용해 구형 u02(ㅑ)가 두 번째 묶음(ㅗ)으로 바뀌지 않게 한다. */
export const KOREAN_BASIC_VOWEL_GROUPS = [
  KOREAN_BASIC_VOWEL_LESSONS.slice(0, 4),
  KOREAN_BASIC_VOWEL_LESSONS.slice(4, 8),
  KOREAN_BASIC_VOWEL_LESSONS.slice(8, 10),
].map((lessons, index) => ({
  id: `kr-v1-g${String(index + 1).padStart(2, '0')}`,
  title: `${lessons.map((lesson) => lesson.vowel).join(' · ')} 배우기`,
  lessons,
  reviewAll: index === 2,
  sourceUnitId: 'kr-h1-u01',
  phonemes: lessons.map((lesson) => lesson.vowel),
  patterns: ['모음'],
  sampleWords: [] as string[],
  blending: [] as string[][],
}));

export const KOREAN_PHONICS_LEARNING_CURRICULUM = [
  {
    level: 'hangul-vowels',
    bookIndex: 1,
    name: 'Book 1: 모음',
    description: '세 묶음 안에서 모음을 하나씩 보고 듣고 쓰고, 익힌 모음으로 놀아요.',
    units: KOREAN_BASIC_VOWEL_GROUPS,
  },
  ...KOREAN_PHONICS_CURRICULUM.map((level, index) => ({
    ...level,
    bookIndex: index + 2,
    name: `Book ${index + 2}: ${TITLES[index]}`,
    description: index === 0 ? '자음 ㄱ~ㅎ와 기본 모음을 조합해 음절을 배워요.' : level.description,
    // Keep authoring/story assets intact. Learner targets must obey the actual chapter scope.
    units: level.units
      .filter((unit) => unit.id !== 'kr-h1-u01')
      .map((unit) => ({
        ...unit,
        sampleWords: unit.sampleWords.filter((word) => isKoreanWordInScope(unit.id, word)),
      })),
  })),
];

/** 과거 방문만으로 완료를 만들지 않는다. 실제 구형 활동 완료만 대응한다. */
export function legacyVowelActivityKeys(unitId: string, legacyDone: readonly string[]): string[] {
  const lesson = KOREAN_BASIC_VOWEL_LESSONS.find((item) => item.id === unitId);
  if (!lesson) return [];
  return [
    ...(legacyDone.includes(lesson.legacyListenKey) ? ['listen-1'] : []),
    ...(legacyDone.includes('write-1') ? ['write-1'] : []),
  ];
}

/** 구형 모음 개요는 첫 묶음, 개별 모음·최근 방문은 그 모음을 포함한 묶음으로 연결한다. */
export function koreanLearningUnitId(unitId: string): string {
  return unitId === 'kr-h1-u01'
    ? KOREAN_BASIC_VOWEL_GROUPS[0].id
    : (KOREAN_BASIC_VOWEL_GROUPS.find((group) =>
        group.lessons.some((lesson) => lesson.id === unitId)
      )?.id ?? unitId);
}

/** 호환은 읽을 때만 적용한다. 원래 진도는 지우거나 새 놀이 완료로 만들지 않는다. */
export function koreanVowelGroupActivityKeys(
  unitId: string,
  readDone: (id: string) => readonly string[]
): string[] {
  const group = KOREAN_BASIC_VOWEL_GROUPS.find((item) => item.id === unitId);
  if (!group) return [...readDone(unitId)];
  const done = new Set(readDone(unitId));
  group.lessons.forEach((lesson, index) => {
    const old = new Set([
      ...readDone(lesson.id),
      ...legacyVowelActivityKeys(lesson.id, readDone(lesson.sourceUnitId)),
    ]);
    for (const kind of ['listen', 'write']) {
      if (old.has(`${kind}-1`)) done.add(`${kind}-${index + 1}`);
    }
  });
  return [...done];
}

/** 구형 개별 모음의 활동 링크도 그 모음의 정확한 위치로 연결한다. */
export function koreanLearningActivityRoute(unitId: string, activityKey: string) {
  const group = KOREAN_BASIC_VOWEL_GROUPS.find((item) =>
    item.lessons.some((lesson) => lesson.id === unitId)
  );
  const index = group?.lessons.findIndex((lesson) => lesson.id === unitId) ?? -1;
  return group && /^(listen|write)-1$/.test(activityKey)
    ? { unitId: group.id, activityKey: activityKey.replace(/1$/, String(index + 1)) }
    : { unitId, activityKey };
}
