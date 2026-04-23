import { KOREAN_PHONICS_CURRICULUM } from '@tangobook/shared';

export interface KoreanPhonicsCell {
  consonant: string;
  vowel: string;
  syllable: string;
  unitId: string;
}

export interface KoreanPhonicsGrid {
  levelId: string;
  levelName: string;
  vowels: string[];
  consonants: string[];
  cells: KoreanPhonicsCell[];
}

const BASE_VOWELS = ['ㅏ', 'ㅑ', 'ㅓ', 'ㅕ', 'ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ', 'ㅣ'];

export function buildKoreanPhonicsGrid(levelId: string): KoreanPhonicsGrid {
  const level = KOREAN_PHONICS_CURRICULUM.find((l) => l.level === levelId);
  if (!level) return { levelId, levelName: levelId, vowels: [], consonants: [], cells: [] };

  const consonants: string[] = [];
  const cells: KoreanPhonicsCell[] = [];
  const vowelOnly: string[] = [];

  for (const u of level.units) {
    if (u.blending.length > 0) {
      consonants.push(u.phonemes[0]);
      for (const b of u.blending) {
        const [c, v, s] = b as [string, string, string];
        cells.push({ consonant: c, vowel: v, syllable: s, unitId: u.id });
      }
    } else {
      vowelOnly.push(...u.phonemes);
    }
  }

  // hangul4처럼 모음만 있는 레벨은 vowelOnly가 그 레벨의 대표 모음.
  // hangul2/3처럼 자음 중심 레벨은 BASE_VOWELS로 채움.
  const vowels = vowelOnly.length > 0 && consonants.length === 0 ? vowelOnly : BASE_VOWELS;

  return { levelId, levelName: level.name, vowels, consonants, cells };
}

export const KOREAN_PHONICS_LEVELS = KOREAN_PHONICS_CURRICULUM.map((l) => ({
  id: l.level,
  name: l.name,
  description: l.description,
}));
