import { KOREAN_PHONICS_CURRICULUM } from './index.js';

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

export const KOREAN_PHONICS_LEARNING_CURRICULUM = [
  {
    level: 'hangul-vowels',
    bookIndex: 1,
    name: 'Book 1: 모음',
    description: '모음 10개를 한 단원에 하나씩 보고 듣고 써요.',
    units: KOREAN_BASIC_VOWEL_LESSONS,
  },
  ...KOREAN_PHONICS_CURRICULUM.map((level, index) => ({
    ...level,
    bookIndex: index + 2,
    name: `Book ${index + 2}: ${TITLES[index]}`,
    description: index === 0 ? '자음 ㄱ~ㅎ와 기본 모음을 조합해 음절을 배워요.' : level.description,
    units: level.units.filter((unit) => unit.id !== 'kr-h1-u01'),
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

/** 기존 모음 개요/최근 방문은 첫 모음으로 연결, 구형 활동 deep link는 그대로 지원한다. */
export function koreanLearningUnitId(unitId: string): string {
  return unitId === 'kr-h1-u01' ? KOREAN_BASIC_VOWEL_LESSONS[0].id : unitId;
}
