import { describe, it, expect } from 'vitest';
import {
  getAllEnglishUnits,
  getEnglishActivityPlan,
  patternHighlight,
  isMagicEPattern,
  patternHighlightRanges,
} from './english-phonics-units';

describe('매직 e = 모음 + 끝 e 두 곳 강조', () => {
  it('Book 3 매직 e(`_ame`·`_ake`·`_ube`)만 매직으로 본다', () => {
    expect(isMagicEPattern('_ame')).toBe(true);
    expect(isMagicEPattern('_ake')).toBe(true);
    expect(isMagicEPattern('_ube')).toBe(true);
    // Book 2 CVC 라임 · Book 4 블렌드 · Book 5 모음팀은 아니다
    expect(isMagicEPattern('_an')).toBe(false); // 끝 e 없음
    expect(isMagicEPattern('bl_')).toBe(false);
    expect(isMagicEPattern('ee')).toBe(false);
    expect(isMagicEPattern('_ng')).toBe(false);
  });

  it('매직 e 는 모음과 끝 e 두 자리, 가운데 자음은 뺀다 — game → a·e', () => {
    const r = patternHighlightRanges('game', '_ame');
    expect(r).toEqual([
      [1, 2], // a
      [3, 4], // 끝 e
    ]);
    // m(2) 은 강조 안 됨
    expect(r.some(([s, e]) => 2 >= s && 2 < e)).toBe(false);
  });

  it('매직 e 아닌 패턴은 붙어 있는 한 덩어리(범위 하나)', () => {
    expect(patternHighlightRanges('black', 'bl_')).toEqual([[0, 2]]); // bl
    expect(patternHighlightRanges('feet', 'ee')).toEqual([[1, 3]]); // ee
    expect(patternHighlightRanges('ring', '_ng')).toEqual([[2, 4]]); // ng
  });
});

describe('patternHighlight — 낱말 안 공통 철자 자리', () => {
  it('끝소리 `_ake` 는 뒤를, 앞소리 `bl_` 는 앞을, 포함 `ee` 는 나온 위치를 잡는다', () => {
    expect('bake'.slice(...patternHighlight('bake', '_ake'))).toBe('ake');
    expect('black'.slice(...patternHighlight('black', 'bl_'))).toBe('bl');
    expect('feet'.slice(...patternHighlight('feet', 'ee'))).toBe('ee');
    // 매칭 안 되면 강조 없음.
    expect(patternHighlight('dog', '_ake')).toEqual([0, 0]);
  });
});

/**
 * 영어 파닉스 단원·복습 가드.
 * 🔴 영어는 한 단원이 글자·패턴을 3~4개씩 안고 있어 한글과 묶음 규칙이 다르다.
 */
describe('english phonics units', () => {
  const units = getAllEnglishUnits();
  const lessons = units.filter((u) => !u.isReview);
  const reviews = units.filter((u) => u.isReview);

  it('커리큘럼 39 단원 + 복습(전 권)', () => {
    expect(lessons).toHaveLength(39);
    // Book 1·2 = 4개씩 · Book 3(7단원, 꼬리 병합) = 3 · Book 4·5 = 4개씩 → 19
    expect(reviews).toHaveLength(19);
    expect(reviews.filter((r) => r.levelIndex <= 2).map((r) => r.id)).toEqual([
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

  it('복습은 전 권(Book 1~5)에 생긴다', () => {
    for (const lvl of [1, 2, 3, 4, 5]) {
      expect(reviews.some((r) => r.levelIndex === lvl)).toBe(true);
    }
  });

  it('Book 3·4·5 = 패턴마다 배우기+써보기 + 게임 3종 (2026-07-31)', () => {
    for (const u of units.filter((x) => x.levelIndex >= 3 && !x.isReview)) {
      const acts = getEnglishActivityPlan(u.id).activities;
      const learn = acts.filter((a) => a.section === 'learn');
      const play = acts.filter((a) => a.section === 'play');
      // 익히기 = 패턴마다 (낱말가족 배우기, 낱말 쓰기 써보기) — Book 2 와 같은 모양
      expect(u.patterns.length).toBeGreaterThan(0);
      expect(learn).toHaveLength(u.patterns.length * 2);
      for (let i = 0; i < u.patterns.length; i++) {
        expect(learn[i * 2].kind).toBe('word-family-learn');
        expect(learn[i * 2].pattern).toBe(u.patterns[i]);
        expect(learn[i * 2 + 1].kind).toBe('game-word-writing');
        expect(learn[i * 2 + 1].pattern).toBe(u.patterns[i]);
      }
      expect(play.map((a) => a.kind)).toEqual([
        'game-english-block',
        'game-connect-dots',
        'game-line-matching',
      ]);
      expect(acts.map((a) => a.order)).toEqual(acts.map((_, i) => i + 1));
    }
  });

  it('복습은 되짚는 마지막 단원 바로 뒤에 온다', () => {
    for (const r of reviews) {
      const idx = units.findIndex((u) => u.id === r.id);
      expect(units[idx - 1].id).toBe(r.coveredUnitIds!.at(-1));
      // 🔴 묶음 = 2단원 (Book 3 은 7단원이라 꼬리가 앞 묶음에 붙어 3단원 하나)
      expect(r.coveredUnitIds!.length).toBeGreaterThanOrEqual(2);
      expect(r.coveredUnitIds!.length).toBeLessThanOrEqual(3);
    }
  });

  // 🔴 복습 활동 구성: Book 2 = 6종 / Book 1 = 듣고낱말 뺀 5종 / Book 3~5 = 낱말 시각 3종.
  it('복습 활동 = 권별로 다른 구성, 카드는 8장 이하 · 번호 연속', () => {
    for (const r of reviews) {
      const acts = getEnglishActivityPlan(r.id).activities;
      const kinds = acts.map((a) => a.kind);
      if (r.levelIndex >= 3) {
        // 낱말 기반 — 낱말↔그림 시각 활동만(글자 사냥·듣기 제외)
        expect(kinds).toEqual(['review-flip', 'review-match', 'review-write']);
      } else if (r.id.startsWith('en-b1')) {
        expect(kinds).toEqual([
          'letter-hunt',
          'review-flip',
          'review-syllable-listen',
          'review-match',
          'review-write',
        ]);
      } else {
        expect(kinds).toEqual([
          'letter-hunt',
          'review-flip',
          'review-syllable-listen',
          'review-match',
          'review-word-listen',
          'review-write',
        ]);
      }
      // order 는 1..N 연속이어야 한다.
      expect(acts.map((a) => a.order)).toEqual(acts.map((_, i) => i + 1));
      for (const a of acts) {
        expect(a.reviewCards!.length).toBeGreaterThan(0);
        expect(a.reviewCards!.length).toBeLessThanOrEqual(8);
      }
    }
  });

  it('Book 3·4·5 복습 카드 = 낱말(letter===word, pickWord 가 그 낱말을 집도록)', () => {
    const r = getEnglishActivityPlan('en-b3-r1').activities[0].reviewCards!;
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((c) => c.letter === c.sound && c.syllable === c.letter)).toBe(true);
    expect(r.map((c) => c.letter)).toContain('bake'); // en-b3-u01 sampleWords
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

  /**
   * 🔴 **쓰기 활동이 plan 에 있어야 라우트로 도달한다**(2026-07-29). 컴포넌트는 원래부터 있었고
   *    호스트도 그 kind 를 다루고 있었는데, plan 이 키를 안 만들어서 **아무도 못 여는 화면**이었다.
   *    한글 단원은 `배우기 → 써보기` 로 나뉘어 있어 영어만 쓰기 카드가 없는 모양이었다.
   */
  it('Book 1 은 별도 글자쓰기 카드 · Book 2 는 배우기 안에서 써보기까지', () => {
    const b1 = getEnglishActivityPlan('en-b1-u01').activities;
    const write = b1.find((a) => a.kind === 'alphabet-letter-write');
    expect(write?.letters).toEqual(['A', 'B', 'C']);
    // 배우기 다음에 온다 — 듣고 고르기까지 하고 나서 쓴다.
    expect(b1.findIndex((a) => a.kind === 'alphabet-letter-write')).toBeGreaterThan(
      b1.findIndex((a) => a.kind === 'alphabet-letter-learn')
    );

    // 🔴 Book 2 는 써보기를 **별도 카드로 두지 않는다**(2026-08-04 사용자: "배우기랑 써보기를 합치자").
    //    cvc-pattern-learn 하나가 Phase A(배우기)→B(단어)→C(써보기)까지 흐른다.
    const b2 = getEnglishActivityPlan('en-b2-u01').activities;
    expect(b2.filter((a) => a.kind === 'cvc-pattern-write').length).toBe(0);
    expect(b2.some((a) => a.kind === 'cvc-pattern-learn')).toBe(true);
  });

  it('Book 1 듣고 고르기는 글자만 쓴다 (단어 철자 X)', () => {
    const acts = getEnglishActivityPlan('en-b1-u01').activities;
    const listen = acts.find((a) => a.kind === 'word-listen-choose')!;
    // 🔴 보기를 flashcard 가 아니라 단원 글자에서 만든다 — 그래서 그림 자산 없이도 동작한다
    expect(listen.letters).toEqual(['A', 'B', 'C']);
  });

  /**
   * 🔴 Book 1 은 글자가 단위라 블록이 한 칸이고, 그 한 칸 채우기는 바로 앞 「배우기 2」가 이미 시킨다.
   *    Book 2 부터는 낱말을 통째로 조립하므로 남긴다.
   */
  it('영어 블록 게임은 Book 2 부터만 나온다', () => {
    const b1 = getEnglishActivityPlan('en-b1-u01').activities.map((a) => a.kind);
    expect(b1).not.toContain('game-english-block');
    const b2 = getEnglishActivityPlan('en-b2-u01').activities.map((a) => a.kind);
    expect(b2).toContain('game-english-block');
  });
});
