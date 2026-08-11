import { describe, it, expect } from 'vitest';
import { decomposeHangul } from '@tangobook/shared';
import {
  getAllKoreanUnits,
  getActivityPlan,
  getRequiredActivities,
  randomReviewSyllable,
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

  /**
   * 🔴 「낱말 놀이」 = 낱말 연습 + 게임 4종, **순서까지 모든 단원이 같다**(2026-07-29).
   *    예전엔 모음 단원만 게임 목록을 따로 적어 두어 순서가 달랐다 — 같은 게임이 단원마다
   *    다른 자리에 있으면 아이가 매번 다시 찾는다.
   */
  const PLAY_ORDER = [
    'word-listen-choose',
    'game-dots',
    'game-korean-block',
    'game-word-writing',
    'game-line-matching',
  ];

  it('모든 학습 단원의 「낱말 놀이」가 같은 5장·같은 순서다', () => {
    for (const u of lessons) {
      const acts = getActivityPlan(u.id).activities;
      expect(acts.filter((a) => a.section === 'play').map((a) => a.key)).toEqual(PLAY_ORDER);
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

  it('복잡한 모음 단원은 음절 만들기(모음 선택 → 자음 음절)로 배운다', () => {
    // 🔴 자음을 배운 뒤라 모음 자체가 아니라 음절을 만든다 — 모음 고르고 ㄱ~ㅎ 붙이기.
    const acts = getActivityPlan('kr-h4-u01').activities;
    const listen = acts.find((a) => a.kind === 'vowel-blend-listen')!;
    expect(listen.vowels).toEqual([
      { vowel: 'ㅐ', syllable: '애' },
      { vowel: 'ㅔ', syllable: '에' },
    ]);
    expect(listen.blendConsonants).toHaveLength(14); // ㄱ~ㅎ
  });

  it('모든 학습 단원이 낱말 연습을 갖는다', () => {
    // 🔴 다른 활동은 누르면 소리가 나는 탐색형이라, 소리 변별을 확인하는 활동은 이것뿐이다.
    for (const u of lessons) {
      expect(getActivityPlan(u.id).activities.map((a) => a.kind)).toContain('word-listen-choose');
    }
    // 🔴 모음 단원(kr-h1-u01)도 포함한다(2026-07-29). 커리큘럼 메타의 `targetWords` 는 비어 있지만
    //    **활동이 읽는 건 단원 storybook** 이고 거기엔 그림 있는 낱말 4개(아이·오이·우유·여우)가 있다.
    //    예전엔 커리큘럼만 보고 "모음 단원은 단어가 없다"고 빼 놨었다.
    expect(units.find((u) => u.id === 'kr-h1-u01')!.targetWords.length).toBe(0);
  });

  it('모음·자음 단원도 글자 사냥을 갖는다 — 목표는 그 단원이 가르치는 글자다', () => {
    // 모음 단원 = 모음 글자 그대로, 소리는 그 음절(ㅏ→아)
    const vowelHunt = getActivityPlan('kr-h1-u01').activities.find(
      (a) => a.kind === 'letter-hunt'
    )!;
    expect(vowelHunt.reviewCards!.map((c) => c.letter)).toEqual([
      'ㅏ',
      'ㅑ',
      'ㅓ',
      'ㅕ',
      'ㅗ',
      'ㅛ',
      'ㅜ',
      'ㅠ',
      'ㅡ',
      'ㅣ',
    ]);
    expect(vowelHunt.reviewCards![0].sound).toBe('아');

    // 🔴 자음 단원은 **음절**(가갸거겨…)이다 — 자음 하나(ㄱ)만 목표로 두면 방금 배운 음절을 안 쓴다.
    const consonantHunt = getActivityPlan('kr-h1-u02').activities.find(
      (a) => a.kind === 'letter-hunt'
    )!;
    expect(consonantHunt.reviewCards!.map((c) => c.letter).join('')).toBe('가갸거겨고교구규그기');

    // 받침 단원은 넣지 않는다 — 받침은 홀로 서는 글자가 아니라 붙는 자리다.
    expect(getActivityPlan('kr-h2-u01').activities.some((a) => a.kind === 'letter-hunt')).toBe(
      false
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
      // 🔴 받침 복습은 phoneme 이 '받침ㅇ' 이라 그대로 쓰면 번역문 안에 한국어가 박힌다
      //    (태국어 UI 에서 `ทบทวน 받침ㅇ~받침ㄹ`). 「받침」은 UI 어휘 → 틀로 빼고 글자만 보간.
      const letters = r.phonemes.map((p) => p.replace('받침', ''));
      const coda = r.levelKey === 'hangul2' ? '받침 ' : '';
      expect(r.unitTitle).toBe(`${coda}${letters[0]}~${letters.at(-1)} 복습`);
      expect(r.unitTitleVars).toEqual({ first: letters[0], last: letters.at(-1) });
    }
  });

  it('단원·레벨 제목은 i18n 키를 들고 있다 — 사이드바가 UI 언어로 그린다', () => {
    for (const u of units) {
      expect(u.unitTitleKey, u.id).toBeTruthy();
      expect(u.levelNameKey, u.id).toBe(`level.${u.levelKey}`);
    }
    // 🔴 콘텐츠 글자는 번역하지 않고 보간 변수로 남는다.
    const coda = units.find((u) => u.id === 'kr-h2-u01')!;
    expect(coda.unitTitleKey).toBe('unit.codaLearn');
    expect(coda.unitTitleVars).toEqual({ letter: 'ㅇ' }); // '받침ㅇ' 아님
    expect(units.find((u) => u.id === 'kr-h1-u01')!.unitTitleKey).toBe('unit.vowelsLearn');
    expect(units.find((u) => u.id === 'kr-h1-u02')!.unitTitleVars).toEqual({ letter: 'ㄱ' });
  });

  it('복습은 게임만 — 익히기 활동이 없다', () => {
    for (const r of reviews) {
      const acts = getActivityPlan(r.id).activities;
      // 🔴 복습에 익히기를 넣으면 학습 단원 축약판이 된다(같은 컴포넌트·같은 그림)
      expect(acts.every((a) => a.section === 'play')).toBe(true);
      // 🔴 형식이 전부 다르다. 그리고 **듣기와 눈으로 보는 활동을 번갈아** 둔다 —
      //    듣기 둘을 붙여 놓으면 아이가 같은 화면을 두 번 하는 걸로 느낀다.
      expect(acts.map((a) => a.kind)).toEqual([
        'letter-hunt', // 글자 사냥
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

  /** 사냥은 자기 카드(음절)를 따로 만든다 — 나머지 다섯이 공유하는 원본 카드는 여기서 본다. */
  const sharedCards = (unitId: string) =>
    getActivityPlan(unitId).activities.find((a) => a.kind === 'review-flip')!.reviewCards!;

  it('받침 복습 카드는 글자와 소리가 다르다', () => {
    const coda = sharedCards('kr-h2-r1').find((c) => c.unitId === 'kr-h2-u01')!;
    expect(coda.letter).toBe('ㅇ');
    expect(coda.sound).toBe('앙'); // 🔴 'ㅇ' 을 그대로 읽으면 초성 이응 소리가 난다
    // 자음 복습은 글자를 그대로 읽는다
    const consonant = sharedCards('kr-h1-r1')[0];
    expect(consonant.letter).toBe(consonant.sound);
  });

  /**
   * 🔴 복습 사냥판은 **낱자가 아니라 음절**이고, 음절은 plan 이 아니라 화면이 뽑는다
   *    (`KoreanPhonicsActivityPage.huntCards` → `randomReviewSyllable`). plan 에서 뽑으면
   *    모듈 로드 때 한 번 고정돼 새로고침 전까지 같은 음절만 나온다.
   *    여기서는 그 재료(`randomReviewSyllable`)가 **되짚는 글자를 지킨 채 나머지를 바꾸는지**를 잠근다.
   */
  it('복습 사냥 음절은 되짚는 글자를 지키면서 매번 달라진다', () => {
    const cards = sharedCards('kr-h1-r1');
    const g = cards.find((c) => c.letter === 'ㄱ')!;
    const seen = new Set<string>();
    for (let i = 0; i < 60; i++) seen.add(randomReviewSyllable(g));
    // 🔴 ㄱ 단원은 `가갸거겨고교구규그기` 를 다 배운다 — 여러 모음에 걸쳐 ㄱ 을 알아보는 게 그 학습의 몫.
    expect(seen.size).toBeGreaterThan(1);
    for (const s of seen) expect(decomposeHangul(s).cho).toBe('ㄱ');

    // 받침 복습은 **받침**이 고정되고 앞 음절이 바뀐다.
    const coda = sharedCards('kr-h2-r1').find((c) => c.unitId === 'kr-h2-u01')!;
    for (let i = 0; i < 30; i++)
      expect(decomposeHangul(randomReviewSyllable(coda)).jong).toBe('ㅇ');
  });

  it('한글1 단원 구성은 그대로다 (회귀 가드)', () => {
    // 🔴 모음 쓰기는 **한 장**(2026-07-29 통합) — 열 글자를 한 활동에서 쓴다.
    expect(getActivityPlan('kr-h1-u01').activities.map((a) => a.key)).toEqual([
      'listen-1',
      'listen-2',
      'write-1',
      'letter-hunt',
      ...PLAY_ORDER,
    ]);
    expect(
      getActivityPlan('kr-h1-u01').activities.find((a) => a.key === 'write-1')!.vowels
    ).toHaveLength(10);
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
