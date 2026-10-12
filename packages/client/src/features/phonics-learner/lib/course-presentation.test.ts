import { describe, expect, it } from 'vitest';
import { getActivityPlan } from './korean-phonics-units';
import { getEnglishActivityPlan, getEnglishUnit } from './english-phonics-units';
import {
  courseActivityMode,
  courseActivityPreview,
  courseUnitPreview,
} from './course-presentation';

describe('과정 카드의 실제 학습 내용', () => {
  it('한글 듣기 1·2의 서로 다른 모음과 쓰기의 음절을 그대로 보여준다', () => {
    const activities = getActivityPlan('kr-h1-u01').activities;
    const listening = activities.filter((activity) => activity.kind === 'vowel-listen');
    expect(listening).toHaveLength(2);
    expect(courseActivityPreview(listening[0])).toEqual(['ㅏ', 'ㅑ', 'ㅓ', 'ㅕ', 'ㅗ', 'ㅛ']);
    expect(courseActivityPreview(listening[1])).toEqual(['ㅜ', 'ㅠ', 'ㅡ', 'ㅣ']);
    const writing = activities.find((activity) => activity.kind === 'vowel-write')!;
    expect(courseActivityPreview(writing)).toEqual(writing.vowels!.map((item) => item.syllable));
    expect(courseActivityPreview(writing)).toContain('아');
  });
  it('영어 알파벳과 패턴을 콘텐츠 값 변경 없이 표시한다', () => {
    const first = getEnglishActivityPlan('en-b1-u01').activities;
    const letter = first.find((activity) => activity.letters?.length)!;
    expect(courseActivityPreview(letter)).toEqual(
      letter.letters!.map((value) => value.toUpperCase() + value.toLowerCase())
    );
    for (const id of ['en-b2-u01', 'en-b3-u01', 'en-b5-u01']) {
      const activity = getEnglishActivityPlan(id).activities.find(
        (item) => item.pattern || item.cvcPattern
      )!;
      expect(courseActivityPreview(activity)).toEqual([
        activity.cvcPattern?.vc ?? activity.pattern,
      ]);
    }
  });
  it('알파벳과 복습 단원에 내부 분류명이 아닌 학습 글자·패턴을 보여준다', () => {
    expect(courseUnitPreview(getEnglishUnit('en-b1-u01')!)).toEqual(['Aa', 'Bb', 'Cc']);
    const preview = courseUnitPreview(getEnglishUnit('en-b3-r1')!);
    expect(preview).toContain('_ame');
    expect(preview).not.toContain('long-a');
  });
  it('게임과 복습의 듣기·쓰기·찾기·조합하기를 구분한다', () => {
    expect(courseActivityMode('game-connect-dots')).toBe('draw');
    expect(courseActivityMode('game-korean-block')).toBe('build');
    expect(courseActivityMode('game-word-writing')).toBe('write');
    expect(courseActivityMode('letter-hunt')).toBe('find');
    expect(courseActivityMode('review-flip')).toBe('match');
    expect(courseActivityMode('review-word-listen')).toBe('listen');
  });
});
