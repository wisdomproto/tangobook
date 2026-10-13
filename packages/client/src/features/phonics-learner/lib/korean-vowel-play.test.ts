import { describe, expect, it } from 'vitest';
import { koreanLearningActivityRoute, koreanLearningUnitId } from '@tangobook/shared';
import { learnedVowelCards } from './korean-vowel-play';
import { progressiveListenBoard } from '../activities/WordListenChooseActivity';

describe('모음 놀이의 배운 글자 범위', () => {
  const done = (id: string) =>
    ({
      'kr-v1-g01': ['listen-1', 'listen-2', 'write-3', 'match-game'],
      'kr-v1-g02': ['listen-1'],
      'kr-v1-g03': ['listen-2'],
    })[id] ?? [];
  it('쓰기와 방문만 마친 글자는 제외하고 현재 묶음의 들은 모음만 사용한다', () => {
    expect(learnedVowelCards('kr-v1-g01', done).map((card) => card.letter)).toEqual(['ㅏ', 'ㅑ']);
    expect(learnedVowelCards('kr-v1-g02', done).map((card) => card.letter)).toEqual(['ㅗ']);
    expect(learnedVowelCards('kr-h1-u02', done)).toEqual([]);
  });
  it('마지막 묶음에서 이전 모음까지 복습하되 미학습 모음은 추가하지 않는다', () => {
    expect(learnedVowelCards('kr-v1-g03', done).map((card) => [card.letter, card.sound])).toEqual([
      ['ㅏ', '아'],
      ['ㅑ', '야'],
      ['ㅗ', '오'],
      ['ㅣ', '이'],
    ]);
  });
  it('정답을 포함한 두 보기부터 늘리고 어떤 라운드도 네 보기를 넘지 않는다', () => {
    const pool = Array.from('ㅏㅑㅓㅕㅗㅛㅜㅠㅡㅣ');
    for (let round = 0; round < pool.length; round++) {
      const shown = progressiveListenBoard(pool, pool[round], round);
      expect(shown).toContain(pool[round]);
      expect(shown).toHaveLength(Math.min(4, round + 2));
      expect(shown.every((letter) => pool.includes(letter))).toBe(true);
    }
    expect(progressiveListenBoard(pool.slice(0, 2), pool[1], 8)).toHaveLength(2);
  });
  it('구형 두 번째 모음 URL은 두 번째 묶음이 아닌 첫 묶음 안의 ㅑ로 이동한다', () => {
    expect(koreanLearningActivityRoute('kr-v1-u02', 'listen-1')).toEqual({
      unitId: 'kr-v1-g01',
      activityKey: 'listen-2',
    });
    expect(koreanLearningActivityRoute('kr-v1-u10', 'write-1')).toEqual({
      unitId: 'kr-v1-g03',
      activityKey: 'write-2',
    });
    expect(koreanLearningUnitId('kr-v1-u05')).toBe('kr-v1-g02');
    expect(koreanLearningActivityRoute('kr-h1-u02', 'blend-listen')).toEqual({
      unitId: 'kr-h1-u02',
      activityKey: 'blend-listen',
    });
    expect(koreanLearningActivityRoute('kr-h1-u01', 'listen-2')).toEqual({
      unitId: 'kr-h1-u01',
      activityKey: 'listen-2',
    });
  });
});
