import { describe, expect, it } from 'vitest';
import { colorSourceOf, findBySlug, groupByUnit, toSlug, type ColoringSheet } from './catalog';

const SHEETS: ColoringSheet[] = [
  {
    unitId: 'kr-h1-u05',
    word: '오리',
    lineartUrl: '/a.png',
    answerUrl: '/a-answer.png',
    originalUrl: 'https://x/o.webp',
  },
  { unitId: 'kr-h1-u05', word: '노루', lineartUrl: '/b.png', originalUrl: 'https://x/n.webp' },
  { unitId: 'kr-h1-u01', word: '여우', lineartUrl: '/c.png', originalUrl: 'https://x/y.webp' },
];

describe('색칠 도안 목록', () => {
  it('단원별로 묶고 단원 순서를 지킨다', () => {
    expect(groupByUnit(SHEETS).map((g) => [g.unitId, g.sheets.length])).toEqual([
      ['kr-h1-u01', 1],
      ['kr-h1-u05', 2],
    ]);
  });

  it('한글 낱말은 그대로, 사이 공백만 하이픈으로', () => {
    expect(toSlug('오리')).toBe('오리');
    expect(toSlug(' 돌 다리 ')).toBe('돌-다리');
  });

  it('slug 로 찾고, 없으면 undefined', () => {
    expect(findBySlug(SHEETS, '오리')?.word).toBe('오리');
    expect(findBySlug(SHEETS, '없는낱말')).toBeUndefined();
  });

  // 🔴 정답본이 없는 도안(앞으로 붙일 2,000여 장)도 색이 나와야 한다.
  //    이게 깨지면 새 도안이 검은 선만 뜨고 물감이 하나도 안 생긴다.
  it('색 출처는 정답본 우선, 없으면 원본 삽화', () => {
    expect(colorSourceOf(SHEETS[0])).toBe('/a-answer.png');
    expect(colorSourceOf(SHEETS[1])).toBe('https://x/n.webp');
    expect(colorSourceOf({ unitId: 'u', word: 'w', lineartUrl: '/x.png' })).toBe('');
  });
});
