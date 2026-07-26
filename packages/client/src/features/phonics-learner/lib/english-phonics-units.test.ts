import { describe, it, expect } from 'vitest';
import { getAllEnglishUnits, getEnglishActivityPlan } from './english-phonics-units';

/**
 * 영어 파닉스 단원·복습 가드.
 * 🔴 영어는 한 단원이 글자·패턴을 3~4개씩 안고 있어 한글과 묶음 규칙이 다르다.
 */
describe('english phonics units', () => {
  const units = getAllEnglishUnits();
  const lessons = units.filter((u) => !u.isReview);
  const reviews = units.filter((u) => u.isReview);

  it('커리큘럼 39 단원 + 복습 8개', () => {
    expect(lessons).toHaveLength(39);
    expect(reviews.map((r) => r.id)).toEqual([
      'en-b1-r1',
      'en-b1-r2',
      'en-b1-r3',
      'en-b1-r4',
      'en-b2-r1',
      'en-b2-r2',
      'en-b2-r3',
      'en-b2-r4',
    ]);
  });

  it('복습은 학습 활동이 있는 Book 1·2 에만 생긴다', () => {
    // Book 3~5 는 학습 활동 자체가 없어 복습을 만들면 빈 복습이 된다
    expect(reviews.every((r) => r.levelIndex <= 2)).toBe(true);
    for (const u of units.filter((x) => x.levelIndex >= 3)) {
      expect(getEnglishActivityPlan(u.id).activities).toHaveLength(0);
    }
  });

  it('복습은 되짚는 마지막 단원 바로 뒤에 온다', () => {
    for (const r of reviews) {
      const idx = units.findIndex((u) => u.id === r.id);
      expect(units[idx - 1].id).toBe(r.coveredUnitIds!.at(-1));
      expect(r.coveredUnitIds).toHaveLength(2); // 🔴 영어 묶음 = 2단원 (한글은 4)
    }
  });

  it('복습 활동은 글자만으로 도는 2종이고 카드는 8장을 넘지 않는다', () => {
    for (const r of reviews) {
      const acts = getEnglishActivityPlan(r.id).activities;
      // 🔴 짝 찾기 없음 — 영어는 단어 그림이 아직 0장이다
      expect(acts.map((a) => a.kind)).toEqual(['review-listen', 'review-write']);
      for (const a of acts) {
        expect(a.reviewCards!.length).toBeGreaterThan(0);
        expect(a.reviewCards!.length).toBeLessThanOrEqual(8);
      }
    }
  });

  it('Book 1 복습 카드는 대문자·소문자 쌍, Book 2 는 VC 패턴', () => {
    const b1 = getEnglishActivityPlan('en-b1-r1').activities[0].reviewCards!;
    expect(b1.slice(0, 3)).toEqual([
      { unitId: 'en-b1-u01', letter: 'A', syllable: 'a', sound: 'a', matchPosition: 'cho' },
      { unitId: 'en-b1-u01', letter: 'B', syllable: 'b', sound: 'b', matchPosition: 'cho' },
      { unitId: 'en-b1-u01', letter: 'C', syllable: 'c', sound: 'c', matchPosition: 'cho' },
    ]);
    const b2 = getEnglishActivityPlan('en-b2-r1').activities[0].reviewCards!;
    expect(b2.map((c) => c.letter)).toEqual(['an', 'at', 'ap', 'ad', 'am']);
  });

  it('Book 1 듣고 고르기는 글자만 쓴다 (단어 철자 X)', () => {
    const acts = getEnglishActivityPlan('en-b1-u01').activities;
    const listen = acts.find((a) => a.kind === 'word-listen-choose')!;
    // 🔴 보기를 flashcard 가 아니라 단원 글자에서 만든다 — 그래서 그림 자산 없이도 동작한다
    expect(listen.letters).toEqual(['A', 'B', 'C']);
  });
});
