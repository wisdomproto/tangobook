import { describe, it, expect } from 'vitest';
import type { LearningEvent } from '@tangobook/shared';
import { buildKoreanPhonicsGrid, KOREAN_PHONICS_LEVELS } from './korean-phonics-grid';
import { groupBySyllable } from './aggregate';

describe('buildKoreanPhonicsGrid', () => {
  it('returns empty grid for unknown level', () => {
    const g = buildKoreanPhonicsGrid('unknown');
    expect(g.vowels).toEqual([]);
    expect(g.rows).toEqual([]);
    expect(g.cells).toEqual([]);
  });

  it('hangul1: 자음 행 × 모음 열', () => {
    const g = buildKoreanPhonicsGrid('hangul1');
    expect(g.cols).toEqual(['ㅏ', 'ㅑ', 'ㅓ', 'ㅕ', 'ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ', 'ㅣ']);
    expect(g.rows).toContain('ㄱ');
    expect(g.rows).toContain('ㅎ');
    expect(g.cells.length).toBeGreaterThanOrEqual(100);
    expect(g.cells).toContainEqual(
      expect.objectContaining({ row: 'ㄱ', col: 'ㅏ', statKey: 'ㄱㅏ', syllable: '가' })
    );
    expect(g.axisLabel).toBe('자음×모음');
  });

  it('hangul2: 받침 행 × 초성 열 — 집계 키에 받침이 들어간다', () => {
    const g = buildKoreanPhonicsGrid('hangul2');
    // 🔴 예전엔 4원소 blending 을 3원소로 읽어 격자가 통째로 비었고, 키가 `ㄱㅏ`(=가)라
    //    한글1 진도를 빌려 쓰고 있었다.
    expect(g.rows).toEqual(['ㅇ', 'ㄱ', 'ㄴ', 'ㄹ', 'ㅅ', 'ㅁ', 'ㅂ']);
    expect(g.cols).toContain('ㄱ');
    expect(g.cells).toContainEqual(
      expect.objectContaining({ row: 'ㅇ', col: 'ㄱ', statKey: 'ㄱㅏㅇ', syllable: '강' })
    );
    expect(g.cells.length).toBe(98); // 받침 7 × 초성 14
    expect(g.axisLabel).toBe('받침×글자');
  });

  it('hangul3: 쌍자음도 자음×모음', () => {
    const g = buildKoreanPhonicsGrid('hangul3');
    expect(g.cols.length).toBe(10);
    expect(g.rows).toContain('ㅆ');
    expect(g.rows).toContain('ㅉ');
    expect(g.cells.some((c) => c.syllable === '짜')).toBe(true);
  });

  it('hangul4: 모음만 — 표를 안 만든다', () => {
    const g = buildKoreanPhonicsGrid('hangul4');
    expect(g.vowels).toContain('ㅐ');
    expect(g.vowels).toContain('ㅘ');
    expect(g.rows).toEqual([]);
    expect(g.cells).toEqual([]);
  });
});

/**
 * 🔴 표를 만드는 쪽(`statKey`)과 집계하는 쪽(`groupBySyllable`)이 **같은 키 규칙**을 써야 한다.
 *    이 둘이 어긋나서 받침 격자가 통째로 비어 있었다 — 각자 테스트가 통과해도 안 잡히는 자리다.
 */
describe('격자 키 ↔ 집계 키', () => {
  const ev = (p: Partial<LearningEvent>): LearningEvent => ({
    id: 'e1',
    profile_id: 'p',
    event_type: 'syllable_correct',
    storybook_id: null,
    game_type: null,
    word: null,
    metadata: {},
    created_at: '2026-07-28T00:00:00Z',
    ...p,
  });

  it('받침 활동 이벤트가 그 칸에 들어간다', () => {
    const g = buildKoreanPhonicsGrid('hangul2');
    const stats = groupBySyllable([
      ev({ word: '강', metadata: { consonant: 'ㄱ', vowel: 'ㅏ', coda: 'ㅇ' } }),
    ]);
    const cell = g.cells.find((c) => c.syllable === '강')!;
    expect(stats.get(cell.statKey)?.correct).toBe(1);
    // 🔴 기본 음절 `가` 칸은 안 건드린다 — 한글2 가 한글1 진도를 빌려 쓰던 게 원래 버그였다.
    expect(stats.get('ㄱㅏ')).toBeUndefined();
  });

  it('동화책 단어 `시장` 이 받침 칸에 부분점수를 얹는다', () => {
    const g = buildKoreanPhonicsGrid('hangul2');
    const stats = groupBySyllable([ev({ event_type: 'word_correct', word: '시장' })]);
    const cell = g.cells.find((c) => c.syllable === '장')!;
    expect(stats.get(cell.statKey)?.correct).toBe(0.25);
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
