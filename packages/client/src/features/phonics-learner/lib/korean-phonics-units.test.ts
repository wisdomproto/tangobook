import { describe, it, expect } from 'vitest';
import {
  getAllKoreanUnits,
  getActivityPlan,
  getRequiredActivities,
  shuffleReviewCards,
} from './korean-phonics-units';

/**
 * 32 단원 전체가 활동을 갖는지 지키는 가드.
 * 한글2~4 plan 은 커리큘럼에서 파생되므로, 커리큘럼이 바뀌면 여기서 먼저 깨진다.
 */
describe('korean phonics activity plans', () => {
  const units = getAllKoreanUnits();

  const lessons = units.filter((u) => !u.isReview);
  const reviews = units.filter((u) => u.isReview);

  it('커리큘럼 32 단원이 모두 활동을 갖는다', () => {
    expect(lessons).toHaveLength(32);
    const empty = units.filter((u) => getActivityPlan(u.id).activities.length === 0);
    expect(empty.map((u) => u.id)).toEqual([]);
  });

  it('모든 학습 단원이 학습 활동 + 게임 4종을 갖는다', () => {
    for (const u of lessons) {
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

  it('받침 단원은 [가]+[ㅇ]→[강] 행을 만들고, 「배우기」는 두지 않는다', () => {
    const u = units.find((x) => x.id === 'kr-h2-u01')!;
    const acts = getActivityPlan(u.id).activities;

    // 🔴 받침은 홀로 소리가 없다 — `ㅇ` 을 눌러 '앙' 을 읽어주면 글자와 소리가 어긋나 보인다.
    //    소리는 붙는 순간에만 생기므로 「붙이기」가 그 역할을 맡고, 「배우기」는 뺀다.
    expect(acts.find((a) => a.kind === 'consonant-tap')).toBeUndefined();
    // 쓰기는 남는다 — 발음은 예시 음절로.
    const write = acts.find((a) => a.kind === 'consonant-write')!;
    expect(write.consonant).toBe('ㅇ');
    expect(write.soundText).toBe('앙');

    // 🔴 1·2 로 나뉘어 있던 걸 한 장으로 합쳤다(2026-07-27) — 자음 단원과 같은 이유.
    const blends = acts.filter((a) => a.kind === 'coda-blend-listen');
    expect(blends).toHaveLength(1);
    expect(blends[0].codaOnsets).toHaveLength(14);
    expect(blends[0].coda).toBe('ㅇ');
  });

  it('쌍자음 단원은 자음 단원과 같은 구성을 쓴다', () => {
    const acts = getActivityPlan('kr-h3-u01').activities;
    expect(acts.find((a) => a.kind === 'consonant-tap')?.consonant).toBe('ㄲ');
    // 🔴 1·2 로 나뉘어 있던 걸 한 장으로 합쳤다(2026-07-26) — 활동이 한 번에 한 짝만 보여준다.
    const blend = acts.filter((a) => a.kind === 'consonant-blend-listen');
    expect(blend).toHaveLength(1);
    expect(blend[0].blendVowels).toHaveLength(10);
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

  it('단어가 있는 학습 단원은 모두 듣고 고르기를 갖는다', () => {
    // 🔴 다른 활동은 누르면 소리가 나는 탐색형이라, 소리 변별을 확인하는 활동은 이것뿐이다.
    const withWords = lessons.filter((u) => u.targetWords.length >= 3);
    expect(withWords.length).toBe(31); // 모음 단원(단어 없음)만 빠진다
    for (const u of withWords) {
      const kinds = getActivityPlan(u.id).activities.map((a) => a.kind);
      expect(kinds).toContain('word-listen-choose');
    }
    // 모음 단원은 단어가 없어 붙지 않는다
    expect(getActivityPlan('kr-h1-u01').activities.map((a) => a.kind)).not.toContain(
      'word-listen-choose'
    );
  });

  it('복습 단원이 레벨마다 묶음 뒤에 끼어든다', () => {
    // 한글1 자음 14(모음 단원은 글자 10개라 제외) → 4·4·6 / 한글2 7 → 4·3 / 한글3·4 각 5 → 1묶음
    expect(reviews.map((r) => r.id)).toEqual([
      'kr-h1-r1',
      'kr-h1-r2',
      'kr-h1-r3',
      'kr-h2-r1',
      'kr-h2-r2',
      'kr-h3-r1',
      'kr-h4-r1',
    ]);
    // 복습은 언제나 자기가 되짚는 마지막 단원 바로 뒤에 온다
    for (const r of reviews) {
      const idx = units.findIndex((u) => u.id === r.id);
      expect(units[idx - 1].id).toBe(r.coveredUnitIds!.at(-1));
    }
    // 🔴 모음 단원은 카드가 10장이 되어 화면이 무너지므로 묶음에서 빠진다
    expect(reviews.flatMap((r) => r.coveredUnitIds!)).not.toContain('kr-h1-u01');
  });

  it('복습 이름은 번호가 아니라 되짚는 글자 범위다', () => {
    // 🔴 `복습 1` 은 무엇을 복습하는지 안 알려준다 — 사이드바·단원 화면이 같은 unitTitle 을 쓴다.
    expect(reviews.map((r) => r.unitTitle)).toContain('ㄱ~ㄹ 복습');
    for (const r of reviews) {
      expect(r.unitTitle).toBe(`${r.phonemes[0]}~${r.phonemes.at(-1)} 복습`);
    }
  });

  it('복습은 게임만 — 익히기 활동이 없다', () => {
    for (const r of reviews) {
      const acts = getActivityPlan(r.id).activities;
      // 🔴 복습에 익히기를 넣으면 학습 단원 축약판이 된다(같은 컴포넌트·같은 그림)
      expect(acts.every((a) => a.section === 'play')).toBe(true);
      // 🔴 형식이 전부 다르다. 그리고 **듣기와 눈으로 보는 활동을 번갈아** 둔다 —
      //    듣기 둘을 붙여 놓으면 아이가 같은 화면을 두 번 하는 걸로 느낀다.
      expect(acts.map((a) => a.kind)).toEqual([
        'review-hunt', // 글자 사냥
        'review-flip', // 뒤집기 짝 맞추기
        'review-syllable-listen', // 듣고 음절 맞추기
        'review-match', // 짝 찾기
        'review-word-listen', // 듣고 단어 맞추기
        'review-write', // 글자 쓰기
      ]);
      for (const a of acts) {
        expect(a.reviewCards!.length).toBeGreaterThan(0);
        expect(a.reviewCards!.length).toBeLessThanOrEqual(6);
      }
    }
  });

  it('받침 복습 카드는 글자와 소리가 다르다', () => {
    const r = reviews.find((x) => x.id === 'kr-h2-r1')!;
    const cards = getActivityPlan(r.id).activities[0].reviewCards!;
    const coda = cards.find((c) => c.unitId === 'kr-h2-u01')!;
    expect(coda.letter).toBe('ㅇ');
    expect(coda.sound).toBe('앙'); // 🔴 'ㅇ' 을 그대로 읽으면 초성 이응 소리가 난다
    // 자음 복습은 글자를 그대로 읽는다
    const consonant = getActivityPlan('kr-h1-r1').activities[0].reviewCards![0];
    expect(consonant.letter).toBe(consonant.sound);
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
    expect(u02.map((a) => a.kind).slice(0, 3)).toEqual([
      'consonant-tap',
      'consonant-blend-listen',
      'consonant-write',
    ]);
  });
});

describe('shuffleReviewCards', () => {
  const cards = ['ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'].map((letter) => ({
    unitId: `u-${letter}`,
    letter,
    syllable: letter,
    sound: letter,
    matchPosition: 'cho' as const,
  }));

  it('카드를 잃지도 늘리지도 않는다', () => {
    const out = shuffleReviewCards(cards);
    expect(out.map((c) => c.letter).sort()).toEqual(['ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'].sort());
  });

  /**
   * 🔴 활동들이 앞에서 4장만 쓴다 — 순서가 고정이면 `ㅍ·ㅎ` 은 여섯 활동 중 넷에서 영영 안 나온다.
   *    여러 번 뽑으면 뒤쪽 글자도 앞 4장에 들어와야 한다.
   */
  it('앞 4장에 뒤쪽 글자도 들어온다 (늘 같은 꼬리가 잘리지 않는다)', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) {
      for (const c of shuffleReviewCards(cards).slice(0, 4)) seen.add(c.letter);
    }
    expect(seen.has('ㅍ')).toBe(true);
    expect(seen.has('ㅎ')).toBe(true);
  });
});
