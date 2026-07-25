import { describe, it, expect } from 'vitest';
import { getAllKoreanUnits, getActivityPlan, getRequiredActivities } from './korean-phonics-units';

/**
 * 32 단원 전체가 활동을 갖는지 지키는 가드.
 * 한글2~4 plan 은 커리큘럼에서 파생되므로, 커리큘럼이 바뀌면 여기서 먼저 깨진다.
 */
describe('korean phonics activity plans', () => {
  const units = getAllKoreanUnits();

  it('커리큘럼 32 단원이 모두 활동을 갖는다', () => {
    expect(units).toHaveLength(32);
    const empty = units.filter((u) => getActivityPlan(u.id).activities.length === 0);
    expect(empty.map((u) => u.id)).toEqual([]);
  });

  it('모든 단원이 학습 활동 + 게임 4종을 갖는다', () => {
    for (const u of units) {
      const acts = getActivityPlan(u.id).activities;
      expect(acts.filter((a) => a.section === 'play')).toHaveLength(4);
      expect(acts.filter((a) => a.section === 'learn').length).toBeGreaterThan(0);
      // order 는 1부터 빈틈없이
      expect(acts.map((a) => a.order)).toEqual(acts.map((_, i) => i + 1));
      // key 중복 없음
      expect(new Set(acts.map((a) => a.key)).size).toBe(acts.length);
      expect(getRequiredActivities(u.id).length).toBeGreaterThan(0);
    }
  });

  it('받침 단원은 [가]+[ㅇ]→[강] 행을 만들고, 홀로 못 내는 받침 소리를 예시 음절로 읽는다', () => {
    const u = units.find((x) => x.id === 'kr-h2-u01')!;
    const acts = getActivityPlan(u.id).activities;

    const tap = acts.find((a) => a.kind === 'consonant-tap')!;
    expect(tap.consonant).toBe('ㅇ');
    expect(tap.soundText).toBe('앙'); // 🔴 'ㅇ' 을 그대로 읽으면 초성 이응 소리가 난다

    const blends = acts.filter((a) => a.kind === 'coda-blend-listen');
    expect(blends).toHaveLength(2);
    expect(blends.flatMap((a) => [...(a.codaOnsets ?? [])])).toHaveLength(14);
    expect(blends.every((a) => a.coda === 'ㅇ')).toBe(true);
  });

  it('쌍자음 단원은 자음 단원과 같은 구성을 쓴다', () => {
    const acts = getActivityPlan('kr-h3-u01').activities;
    expect(acts.find((a) => a.kind === 'consonant-tap')?.consonant).toBe('ㄲ');
    expect(acts.filter((a) => a.kind === 'consonant-blend-listen')).toHaveLength(2);
    expect(acts.find((a) => a.kind === 'consonant-write')?.consonant).toBe('ㄲ');
    // 자음 단원은 예시 음절이 필요 없다 (글자 그대로 읽음)
    expect(acts.find((a) => a.kind === 'consonant-tap')?.soundText).toBeUndefined();
  });

  it('복잡한 모음 단원은 모음 음절을 조합으로 파생한다', () => {
    const acts = getActivityPlan('kr-h4-u01').activities;
    const listen = acts.find((a) => a.kind === 'vowel-listen')!;
    expect(listen.vowels).toEqual([
      { vowel: 'ㅐ', syllable: '애' },
      { vowel: 'ㅔ', syllable: '에' },
    ]);
    expect(acts.find((a) => a.kind === 'vowel-write')?.vowels).toEqual(listen.vowels);
  });

  it('한글1 단원 구성은 그대로다 (회귀 가드)', () => {
    expect(getActivityPlan('kr-h1-u01').activities.map((a) => a.key)).toEqual([
      'listen-1',
      'listen-2',
      'write-1',
      'write-2',
      'game-dots',
      'game-korean-block',
      'game-word-writing',
      'game-line-matching',
    ]);
    const u02 = getActivityPlan('kr-h1-u02').activities;
    expect(u02.map((a) => a.kind).slice(0, 4)).toEqual([
      'consonant-tap',
      'consonant-blend-listen',
      'consonant-blend-listen',
      'consonant-write',
    ]);
  });
});
