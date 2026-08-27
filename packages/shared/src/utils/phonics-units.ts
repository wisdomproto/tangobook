/**
 * 파닉스 커리큘럼을 「단원 목록」으로 펴 주는 공용 유틸.
 *
 * 🔴 **서버 SSR(`seo-phonics.service`)과 클라 짝 페이지(`PhonicsCurriculumPage`)가 같은 함수를 쓴다.**
 *    책 `/library/:id/about` 처럼 파닉스도 크롤러용 SSR 과 사람용 React 페이지가 한 쌍인데,
 *    단원을 펴는 규칙을 양쪽에 각각 적으면 갈라진다(번호가 어긋나면 같은 URL 이 서로 다른
 *    단원을 가리킨다). 그래서 shared 에 둔다.
 */
import { KOREAN_PHONICS_CURRICULUM, ENGLISH_PHONICS_CURRICULUM } from '../constants/index.js';

export const PHONICS_TRACK_META = {
  korean: {
    label: '한글 파닉스',
    learnBase: '/library/phonics/korean',
    soundNoun: '자음과 모음',
  },
  english: {
    label: '영어 파닉스',
    learnBase: '/library/phonics/english',
    soundNoun: '알파벳 소리',
  },
} as const;

export type PhonicsTrack = keyof typeof PHONICS_TRACK_META;

export function isPhonicsTrack(v: string): v is PhonicsTrack {
  return v === 'korean' || v === 'english';
}

export function phonicsCurriculum(track: PhonicsTrack) {
  return track === 'korean' ? KOREAN_PHONICS_CURRICULUM : ENGLISH_PHONICS_CURRICULUM;
}

export interface FlatPhonicsUnit {
  id: string;
  /** `unit 02: ㄱ 배우기` 에서 앞머리를 뗀 `ㄱ 배우기` */
  name: string;
  levelName: string;
  levelDescription: string;
  phonemes: string[];
  patterns: string[];
  sampleWords: string[];
  /** 한글 전용 — blending 으로 만들어진 음절 (영어 커리큘럼엔 blending 이 없다) */
  syllables: string[];
  /** 트랙 전체에서 몇 번째인가 (1-based) */
  position: number;
}

/** 레벨 중첩을 평평하게 편다 — 배열 순서가 곧 커리큘럼 순서다. */
export function flattenPhonicsUnits(track: PhonicsTrack): FlatPhonicsUnit[] {
  const out: FlatPhonicsUnit[] = [];
  for (const level of phonicsCurriculum(track)) {
    for (const raw of level.units) {
      const unit = raw as {
        id: string;
        title: string;
        phonemes?: readonly string[];
        patterns?: readonly string[];
        sampleWords?: readonly string[];
        blending?: readonly (readonly string[])[];
      };
      out.push({
        id: unit.id,
        name: unit.title.replace(/^unit\s*\d+\s*:\s*/i, '').trim() || unit.title,
        levelName: level.name,
        levelDescription: level.description,
        phonemes: [...(unit.phonemes ?? [])],
        patterns: [...(unit.patterns ?? [])],
        sampleWords: [...(unit.sampleWords ?? [])],
        // 🔴 blending 의 **마지막** 원소가 만들어진 글자다 — 받침 단원은 `[초성,중성,받침,결과]`
        //    4원소라 index 2 로 집으면 받침 글자가 나온다(부모 리포트 격자가 같은 이유로
        //    통째로 비어 있던 적이 있다).
        syllables: (unit.blending ?? []).map((b) => b[b.length - 1]).filter(Boolean),
        position: out.length + 1,
      });
    }
  }
  return out;
}

export function findPhonicsUnit(track: PhonicsTrack, unitId: string): FlatPhonicsUnit | null {
  return flattenPhonicsUnits(track).find((u) => u.id === unitId) ?? null;
}
