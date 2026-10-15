import { expect, it } from 'vitest';
import { getAllKoreanUnits, getActivityPlan } from './korean-phonics-units';
import { consonantFindingBoard, learnedFindingConsonants } from './consonant-finding';

it('carries ㅇ from vowel lessons and never introduces a future distractor', () => {
  expect(learnedFindingConsonants('kr-h1-u02')).toEqual(['ㅇ', 'ㄱ']);
  const first = consonantFindingBoard('kr-h1-u02', 'ㄱ');
  expect(first.filter((x) => x === 'ㄱ')).toHaveLength(4);
  expect(first.filter((x) => x === 'ㅇ')).toHaveLength(8);
  expect(learnedFindingConsonants('kr-h1-u03')).toEqual(['ㅇ', 'ㄱ', 'ㄴ']);
  expect(consonantFindingBoard('kr-h1-u03', 'ㄴ').filter((x) => x === 'ㄴ')).toHaveLength(4);
  expect(consonantFindingBoard('kr-h1-u03', 'ㄷ')).toEqual([]);
});

it('uses only earlier explicit consonants in every basic and doubled consonant chapter', () => {
  const introduced: string[] = ['ㅇ'];
  for (const unit of getAllKoreanUnits()) {
    const finding = getActivityPlan(unit.id).activities.find((a) => a.kind === 'consonant-find');
    if (!unit.isReview && ['hangul1', 'hangul3'].includes(unit.levelKey)) {
      introduced.push(...unit.phonemes.filter((x) => /^[ㄱ-ㅎ]$/.test(x)));
      expect(finding?.consonant).toBe(unit.phonemes[0]);
      const board = consonantFindingBoard(unit.id, finding!.consonant!, () => 0.37);
      expect(board.filter((x) => x === finding!.consonant)).toHaveLength(4);
      expect(board.every((x) => introduced.includes(x))).toBe(true);
      expect(learnedFindingConsonants(unit.id)).toEqual([...new Set(introduced)]);
    } else expect(finding).toBeUndefined();
  }
});
