import { describe, it, expect } from 'vitest';
import { buildKoreanPhonicsGrid, KOREAN_PHONICS_LEVELS } from './korean-phonics-grid';

describe('buildKoreanPhonicsGrid', () => {
  it('returns empty grid for unknown level', () => {
    const g = buildKoreanPhonicsGrid('unknown');
    expect(g.vowels).toEqual([]);
    expect(g.consonants).toEqual([]);
    expect(g.cells).toEqual([]);
  });

  it('hangul1: 10 vowels + ~14 consonants + ~140 cells', () => {
    const g = buildKoreanPhonicsGrid('hangul1');
    expect(g.vowels).toEqual(['ㅏ', 'ㅑ', 'ㅓ', 'ㅕ', 'ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ', 'ㅣ']);
    expect(g.consonants).toContain('ㄱ');
    expect(g.consonants).toContain('ㅎ');
    expect(g.consonants.length).toBeGreaterThanOrEqual(10);
    expect(g.cells.length).toBeGreaterThanOrEqual(100);
    expect(g.cells).toContainEqual(
      expect.objectContaining({ consonant: 'ㄱ', vowel: 'ㅏ', syllable: '가' })
    );
  });

  it('hangul3: uses base vowels + 쌍자음 consonants + has cells', () => {
    const g = buildKoreanPhonicsGrid('hangul3');
    expect(g.vowels.length).toBe(10);
    expect(g.consonants).toContain('ㅆ');
    expect(g.consonants).toContain('ㅉ');
    expect(g.cells.some((c) => c.syllable === '짜')).toBe(true);
  });

  it('hangul4: complex vowels only, no cells', () => {
    const g = buildKoreanPhonicsGrid('hangul4');
    expect(g.vowels).toContain('ㅐ');
    expect(g.vowels).toContain('ㅘ');
    expect(g.consonants).toEqual([]);
    expect(g.cells).toEqual([]);
  });
});

describe('KOREAN_PHONICS_LEVELS', () => {
  it('exposes all 4 levels with name + description', () => {
    expect(KOREAN_PHONICS_LEVELS.map((l) => l.id)).toEqual([
      'hangul1',
      'hangul2',
      'hangul3',
      'hangul4',
    ]);
    expect(KOREAN_PHONICS_LEVELS.every((l) => l.name && l.description)).toBe(true);
  });
});
