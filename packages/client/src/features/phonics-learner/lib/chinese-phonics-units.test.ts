import { describe, it, expect } from 'vitest';
import {
  CHANT_URLS,
  getAllChineseUnits,
  getChineseActivityPlan,
  getChineseListenCards,
  getChineseRequiredActivities,
  getChineseToneChoiceCards,
  getChineseUnit,
  getChineseUnitCards,
  hanziFor,
  isBlendUnit,
  isCombineUnit,
  isInitialUnit,
  isReviewUnit,
  isToneUnit,
  isWholeUnit,
  isWordUnit,
  syllableCount,
  toneMarkOf,
  withTone,
  L4_WORDS,
} from './chinese-phonics-units';

describe('중국어 병음 파닉스 L1~L3 (교안 순서: 성조 먼저)', () => {
  it('L1(성조 먼저) → L2 성모 6유닛 → L3 병음조합 4유닛 → L4 단어 3유닛 순서', () => {
    const units = getAllChineseUnits();
    expect(units.map((u) => u.id)).toEqual([
      'zh-l1-u01',
      'zh-l1-u02',
      'zh-l1-u03',
      'zh-l2-u01',
      'zh-l2-u02',
      'zh-l2-u03',
      'zh-l2-u04',
      'zh-l2-u05',
      'zh-l2-u06',
      'zh-l3-u01',
      'zh-l3-u02',
      'zh-l3-u03',
      'zh-l3-u04',
      'zh-l3-u05',
      'zh-l3-u06',
      'zh-l4-u01',
      'zh-l4-u02',
      'zh-l4-u03',
      'zh-l4-u04',
      'zh-l4-r1', // 🏅 L4 낱말 복습 — 마지막 낱말 유닛 뒤에 삽입
      'zh-l5-u01',
      'zh-l5-u02',
      'zh-l5-u03',
      'zh-l5-u04',
      'zh-l5-u05',
      'zh-l5-u06',
      'zh-l5-r1', // 🏅 L5 낱말 복습
      'zh-l6-u01',
      'zh-l6-u02',
      'zh-l6-u03',
      'zh-l6-u04',
      'zh-l6-u05',
      'zh-l6-u06',
      'zh-l6-u07',
      'zh-l6-r1', // 🏅 L6 낱말 복습
      'zh-l7-u01',
      'zh-l7-u02',
      'zh-l7-u03',
      'zh-l7-u04',
      'zh-l7-u05',
      'zh-l8-u01',
      'zh-l8-u02',
      'zh-l8-u03',
      'zh-l8-u04',
      'zh-l8-u05',
      'zh-l8-u06',
      'zh-l8-u07',
      'zh-l8-u08',
      'zh-l8-u09',
      'zh-l8-u10',
      'zh-l8-u11',
      'zh-l8-u12',
      'zh-l8-u13',
      'zh-l8-u14',
      'zh-l8-r1', // 🏅 L8 2음절 낱말 복습
    ]);
    // 🔴 L1 첫 유닛 = 성조, 나머지 둘 = 단운모. L2 는 전부 성모. L3 는 전부 병음조합(combine, blend 와 구분).
    expect(isToneUnit('zh-l1-u01')).toBe(true);
    expect(isToneUnit('zh-l1-u02')).toBe(false);
    expect(isInitialUnit('zh-l1-u02')).toBe(false);
    expect(isInitialUnit('zh-l2-u01')).toBe(true);
    expect(isToneUnit('zh-l2-u01')).toBe(false);
    // 🔴 L3 = combine(모음별 성모 4성), blend 아님. blend 는 L5/L6 복운모·비운모 전용.
    expect(isCombineUnit('zh-l3-u01')).toBe(true);
    expect(isCombineUnit('zh-l3-u06')).toBe(true);
    expect(isBlendUnit('zh-l3-u01')).toBe(false);
    expect(isCombineUnit('zh-l5-u01')).toBe(false);
    expect(isBlendUnit('zh-l2-u01')).toBe(false);
    expect(isBlendUnit('zh-l1-u01')).toBe(false);
    // L5 복운모·L6 비운모도 블렌드(같은 메커니즘).
    expect(isBlendUnit('zh-l5-u01')).toBe(true);
    expect(isBlendUnit('zh-l6-u01')).toBe(true);
    expect(isBlendUnit('zh-l6-u04')).toBe(true);
  });

  // 🔴 plan 이 없으면 라우트로 도달해도 죽은 코드 — 모든 유닛이 도달 가능한 plan 을 갖는지.
  it('모든 유닛의 plan 첫 활동이 도달 가능(소리·낱말=word-listen-choose / 복습=letter-hunt)', () => {
    for (const u of getAllChineseUnits()) {
      const plan = getChineseActivityPlan(u.id);
      expect(plan.activities.length, `${u.id} plan 비어 있음`).toBeGreaterThan(0);
      if (u.isReview) {
        // 단음절 복습은 소스 없이 도달 가능한 letter-hunt 로 시작 / 2음절(L8)은 글자 사냥을 빼 review-flip 로 시작.
        const monosyllabic = u.targetWords.every((w) => syllableCount(w) === 1);
        expect(plan.activities[0].kind).toBe(monosyllabic ? 'letter-hunt' : 'review-flip');
        continue;
      }
      expect(plan.activities[0].kind).toBe('word-listen-choose');
      // 소리 유닛(L1~L3)=listen-choose / 단어 유닛(L4)=word-practice — 둘 다 required 로 도달 가능.
      const requiredKey = isWordUnit(u.id) ? 'word-practice' : 'listen-choose';
      expect(getChineseRequiredActivities(u.id)).toContain(requiredKey);
    }
  });

  // ── 복습 단원(낱말 유닛만 레벨별 청킹) ─────────────────────────────────────────
  it('복습 = 레벨별 낱말 유닛 묶음(L4·L5·L6 각 1개), 마지막 낱말 유닛 뒤에 삽입', () => {
    const units = getAllChineseUnits();
    const reviews = units.filter((u) => u.isReview);
    expect(reviews.map((u) => u.id)).toEqual(['zh-l4-r1', 'zh-l5-r1', 'zh-l6-r1', 'zh-l8-r1']);
    // L8 2음절 낱말 8유닛 → 복습 하나(그림 있는 낱말 유닛이라 청킹됨).
    expect(units.find((u) => u.id === 'zh-l8-r1')!.coveredUnitIds).toEqual([
      'zh-l8-u01',
      'zh-l8-u02',
      'zh-l8-u03',
      'zh-l8-u04',
      'zh-l8-u05',
      'zh-l8-u06',
      'zh-l8-u07',
      'zh-l8-u08',
      'zh-l8-u09',
      'zh-l8-u10',
      'zh-l8-u11',
      'zh-l8-u12',
      'zh-l8-u13',
      'zh-l8-u14',
    ]);
    // coveredUnitIds = 그 레벨의 낱말 유닛 전부.
    expect(units.find((u) => u.id === 'zh-l4-r1')!.coveredUnitIds).toEqual([
      'zh-l4-u01',
      'zh-l4-u02',
      'zh-l4-u03',
      'zh-l4-u04',
    ]);
    expect(units.find((u) => u.id === 'zh-l5-r1')!.coveredUnitIds).toEqual([
      'zh-l5-u04',
      'zh-l5-u05',
      'zh-l5-u06',
    ]);
    expect(units.find((u) => u.id === 'zh-l6-r1')!.coveredUnitIds).toEqual([
      'zh-l6-u05',
      'zh-l6-u06',
      'zh-l6-u07',
    ]);
    // 소리 유닛(L1~L3·L7)은 그림이 없어 복습 대상이 아니다.
    expect(reviews.some((u) => u.levelIndex === 1 || u.levelIndex === 7)).toBe(false);
    // isReviewUnit 판정.
    expect(isReviewUnit('zh-l4-r1')).toBe(true);
    expect(isReviewUnit('zh-l4-u01')).toBe(false);
  });

  it('단음절 복습(L4·L5·L6) plan = 게임 5종(사냥·뒤집기·듣고 낱말·짝 찾기·성조 고르기), 전부 play', () => {
    for (const id of ['zh-l4-r1', 'zh-l5-r1', 'zh-l6-r1']) {
      const plan = getChineseActivityPlan(id);
      expect(plan.activities.map((a) => a.kind)).toEqual([
        'letter-hunt',
        'review-flip',
        'review-word-listen',
        'review-match',
        'tone-choice-review',
      ]);
      expect(plan.activities.every((a) => a.section === 'play')).toBe(true);
      // 🔴 letter-hunt 는 소스(storybook) 없이 도달 가능해야 한다 — required 에 있고 첫 활동이다.
      expect(plan.activities[0].kind).toBe('letter-hunt');
    }
  });

  // 🔴 2음절 복습(L8)은 글자 사냥·성조 고르기를 뺀다 — 둘 다 낱글자/단일성조 전용이라 2음절에 안 맞는다
  //    (7~8자 병음이 타일 넘침 + 성조 변이 방해꾼 무음 / withTone 이 첫 성조 지움). 그림 기반 3종만.
  it('2음절 복습(zh-l8-r1) plan = 그림 기반 3종(글자 사냥·성조 고르기 없음)', () => {
    const plan = getChineseActivityPlan('zh-l8-r1');
    expect(plan.activities.map((a) => a.kind)).toEqual([
      'review-flip',
      'review-word-listen',
      'review-match',
    ]);
    expect(plan.activities.some((a) => a.kind === 'letter-hunt')).toBe(false);
    expect(plan.activities.some((a) => a.kind === 'tone-choice-review')).toBe(false);
  });

  it('syllableCount: 단음절=1 / 2음절=2 (성모·코다가 음절을 가른다)', () => {
    expect(syllableCount('māo')).toBe(1);
    expect(syllableCount('xióng')).toBe(1);
    expect(syllableCount('shuǐ')).toBe(1);
    expect(syllableCount('hǎibiān')).toBe(2);
    expect(syllableCount('wěiba')).toBe(2); // 경성(둘째 무표기)도 2음절
    expect(syllableCount('àixīn')).toBe(2); // 모음 시작 음절도 성모/코다로 갈림
  });

  it('toneMarkOf: 병음 낱말 → 성조 부호 (nucleus + 실제 성조)', () => {
    expect(toneMarkOf('māo')).toBe('ā'); // 1성, nucleus a
    expect(toneMarkOf('niú')).toBe('ú'); // 2성 — iu 는 성조가 u 에 얹힌다
    expect(toneMarkOf('shuǐ')).toBe('ǐ'); // 3성 — ui 는 성조가 i 에 얹힌다
    expect(toneMarkOf('mù')).toBe('ù'); // 4성, nucleus u
    expect(toneMarkOf('lǚ')).toBe('ǚ'); // 3성, nucleus ü(u+¨)
  });

  it('withTone: 낱말 nucleus 성조를 1~4 로 바꾼 4형 (성조만 변별, 모음 confound 없음)', () => {
    // 한 낱말의 4형은 서로 다르고, 성조부호만 다르다.
    expect([1, 2, 3, 4].map((n) => withTone('māo', n))).toEqual(['māo', 'máo', 'mǎo', 'mào']);
    // iu 는 성조가 u 에, ui 는 i 에 얹힌다.
    expect(withTone('niú', 3)).toBe('niǔ');
    expect(withTone('shuǐ', 4)).toBe('shuì');
    // 원래 낱말 = 그 실제 성조를 얹은 형(정답이 4형 안에 있다).
    expect(withTone('mù', 4)).toBe('mù');
    // ü 낱말도 합자 성조로.
    expect(withTone('lǚ', 2)).toBe('lǘ');
  });

  it('성조 유닛(u01) = 듣고 배우기 + 성조 듣고 고르기', () => {
    const plan = getChineseActivityPlan('zh-l1-u01');
    expect(plan.activities.map((a) => a.kind)).toEqual([
      'word-listen-choose',
      'word-listen-choose',
      'chant',
    ]);
    expect(plan.activities.map((a) => a.key)).toEqual(['listen-choose', 'tone-choose', 'chant']);
  });

  it('단운모 유닛(u02·u03) = 듣고 배우기 + 따라쓰기 + 글자 사냥', () => {
    for (const id of ['zh-l1-u02', 'zh-l1-u03']) {
      const kinds = getChineseActivityPlan(id).activities.map((a) => a.kind);
      expect(kinds).toEqual(['word-listen-choose', 'vowel-write', 'letter-hunt', 'chant']);
    }
  });

  it('성조 유닛 배우기 카드 = 4성 음절(a: ā á ǎ à, 라벨=소리, 시퀀스 없음)', () => {
    expect(getChineseListenCards('zh-l1-u01')).toEqual([
      { label: 'ā', sound: 'ā' },
      { label: 'á', sound: 'á' },
      { label: 'ǎ', sound: 'ǎ' },
      { label: 'à', sound: 'à' },
    ]);
  });

  // 🔴 단운모 배우기 = 낱 모음 카드지만 누르면 그 모음의 4성을 순서로(운모 놀이판, 성조 비교).
  it('단운모 배우기 카드 = 낱 모음 라벨 + 4성 시퀀스', () => {
    expect(getChineseListenCards('zh-l1-u02')).toEqual([
      { label: 'a', sound: 'ā', sounds: ['ā', 'á', 'ǎ', 'à'] },
      { label: 'o', sound: 'ō', sounds: ['ō', 'ó', 'ǒ', 'ò'] },
      { label: 'e', sound: 'ē', sounds: ['ē', 'é', 'ě', 'è'] },
    ]);
    expect(getChineseListenCards('zh-l1-u03')).toEqual([
      { label: 'i', sound: 'ī', sounds: ['ī', 'í', 'ǐ', 'ì'] },
      { label: 'u', sound: 'ū', sounds: ['ū', 'ú', 'ǔ', 'ù'] },
      { label: 'ü', sound: 'ǖ', sounds: ['ǖ', 'ǘ', 'ǚ', 'ǜ'] },
    ]);
  });

  // 🔴 쓰기·사냥은 낱 모음 글자 하나가 목표 — 4성 안 붙는다(tone-1 소릿결만).
  it('쓰기·사냥 카드(getChineseUnitCards) = 낱 모음, 소리 tone-1', () => {
    const cards = getChineseUnitCards('zh-l1-u02');
    expect(cards.map((c) => c.label)).toEqual(['a', 'o', 'e']);
    expect(cards.map((c) => c.sound)).toEqual(['ā', 'ō', 'ē']);
    expect(getChineseUnitCards('zh-l1-u03').map((c) => c.sound)).toEqual(['ī', 'ū', 'ǖ']);
  });

  it('성조 듣고 고르기(u01) = 보기 성조 부호(ā á ǎ à), 소리 4성 음절', () => {
    expect(getChineseToneChoiceCards('zh-l1-u01')).toEqual([
      { label: 'ā', sound: 'ā' },
      { label: 'á', sound: 'á' },
      { label: 'ǎ', sound: 'ǎ' },
      { label: 'à', sound: 'à' },
    ]);
    // 단운모 유닛엔 성조 고르기 카드가 없다.
    expect(getChineseToneChoiceCards('zh-l1-u02')).toEqual([]);
  });

  // ── L2 성모 ──────────────────────────────────────────────────────────────
  // 🔴 성모 카드 = 글자(b) → 결합음(bō), 낱 소리 하나(4성 시퀀스 없음).
  it('성모 배우기·쓰기·사냥 카드 = 성모 글자 라벨 + 결합음(단일)', () => {
    expect(getChineseListenCards('zh-l2-u01')).toEqual([
      { label: 'b', sound: 'bō' },
      { label: 'p', sound: 'pō' },
      { label: 'm', sound: 'mō' },
      // 🔴 fó(2성) — fō(1성)는 실존 음절이 아니라 녹음 부재. 성모 글자만 보여 성조차는 안 드러남.
      { label: 'f', sound: 'fó' },
    ]);
    // 배우기·쓰기·사냥이 같은 모양(시퀀스 없음).
    expect(getChineseUnitCards('zh-l2-u01')).toEqual(getChineseListenCards('zh-l2-u01'));
    expect(getChineseUnitCards('zh-l2-u04').map((c) => c.sound)).toEqual(['jī', 'qī', 'xī']);
  });

  it('단일 글자 성모 유닛 = 배우기 + 따라쓰기 + 글자 사냥', () => {
    for (const id of ['zh-l2-u01', 'zh-l2-u02', 'zh-l2-u03', 'zh-l2-u04', 'zh-l2-u05']) {
      const kinds = getChineseActivityPlan(id).activities.map((a) => a.kind);
      expect(kinds).toEqual(['word-listen-choose', 'vowel-write', 'letter-hunt', 'chant']);
    }
  });

  // 🔴 zh/ch/sh 2글자 성모 유닛 = LetterFillCanvas 못 씀 → 따라쓰기 생략(배우기·사냥만).
  it('권설 성모 유닛(u06) = 배우기 + 글자 사냥(따라쓰기 없음)', () => {
    const kinds = getChineseActivityPlan('zh-l2-u06').activities.map((a) => a.kind);
    expect(kinds).toEqual(['word-listen-choose', 'letter-hunt', 'chant']);
    expect(getChineseUnitCards('zh-l2-u06').map((c) => c.label)).toEqual(['zh', 'ch', 'sh', 'r']);
    expect(getChineseUnitCards('zh-l2-u06').map((c) => c.sound)).toEqual([
      'zhī',
      'chī',
      'shī',
      'rì',
    ]);
  });

  // ── L3 병음조합(拼读) — 모음별 성모 4성(combine) ─────────────────────────────
  // 🔴 plan = 배우기(listen-choose, 성모 4성 놀이판 탐색) + 듣고 고르기(listen-quiz, 성모 퀴즈). 둘 다 word-listen-choose.
  it('병음조합 6유닛(a/o/e/i/u/ü) = 배우기 + 듣고 고르기(둘 다 word-listen-choose)', () => {
    for (const id of [
      'zh-l3-u01',
      'zh-l3-u02',
      'zh-l3-u03',
      'zh-l3-u04',
      'zh-l3-u05',
      'zh-l3-u06',
    ]) {
      expect(isCombineUnit(id)).toBe(true);
      expect(isBlendUnit(id)).toBe(false);
      expect(isWordUnit(id)).toBe(false);
      const plan = getChineseActivityPlan(id);
      expect(plan.activities.map((a) => a.kind)).toEqual([
        'word-listen-choose',
        'word-listen-choose',
        'chant',
      ]);
      expect(plan.activities.map((a) => a.key)).toEqual(['listen-choose', 'listen-quiz', 'chant']);
      // required 는 chant(required:false)를 안 센다.
      expect(getChineseRequiredActivities(id)).toEqual(['listen-choose', 'listen-quiz']);
    }
  });

  // 🔴 배우기 카드 = 성모 라벨 + 그 성모+모음의 실존 4성 시퀀스. sound = syl[0]. 전 음절 mod_chinese 직행.
  it('병음조합 배우기 카드 = 성모 라벨 + 4성 시퀀스 (a 유닛 = 13 성모)', () => {
    const a = getChineseListenCards('zh-l3-u01');
    expect(a.map((c) => c.label)).toEqual([
      'b',
      'p',
      'm',
      'f',
      'd',
      't',
      'n',
      'l',
      'g',
      'h',
      'zh',
      'ch',
      'sh',
    ]);
    expect(a[0]).toEqual({ label: 'b', sound: 'bā', sounds: ['bā', 'bá', 'bǎ', 'bà'] });
    // 🔴 실존 음절만 — p+a 는 pǎ 가 없어 3성. generate-all-4 가 아니라 실측 표.
    expect(a[1]).toEqual({ label: 'p', sound: 'pā', sounds: ['pā', 'pá', 'pà'] });
  });

  // o 유닛(3 성모)·ü 유닛(3 성모) = 전 카드 검증.
  it('병음조합 o·ü 유닛 배우기 카드', () => {
    expect(getChineseListenCards('zh-l3-u02')).toEqual([
      { label: 'b', sound: 'bō', sounds: ['bō', 'bó', 'bǒ', 'bò'] },
      { label: 'p', sound: 'pō', sounds: ['pō', 'pó', 'pǒ', 'pò'] },
      { label: 'm', sound: 'mō', sounds: ['mō', 'mó', 'mǒ', 'mò'] },
    ]);
    expect(getChineseListenCards('zh-l3-u06')).toEqual([
      { label: 'j', sound: 'jū', sounds: ['jū', 'jú', 'jǔ', 'jù'] },
      { label: 'q', sound: 'qū', sounds: ['qū', 'qú', 'qǔ', 'qù'] },
      { label: 'x', sound: 'xū', sounds: ['xū', 'xú', 'xǔ', 'xù'] },
    ]);
  });

  // 🔴 sound = syl[0] 은 tone-1 이 아닐 수 있다 — m+u 는 mū 가 없어 syl[0]='mú'(2성).
  it('병음조합 u 유닛 = syl[0] 이 tone-1 아닌 성모 포함 (m→mú)', () => {
    const u = getChineseListenCards('zh-l3-u05');
    expect(u.length).toBe(17);
    expect(u.find((c) => c.label === 'm')).toEqual({
      label: 'm',
      sound: 'mú',
      sounds: ['mú', 'mǔ', 'mù'],
    });
  });

  // ── 낱말 유닛(单词) — L4 CV + L5/L6 복운모·비운모 구체 낱말 ─────────────────────
  const wordUnitIds = getAllChineseUnits()
    .filter((u) => isWordUnit(u.id))
    .map((u) => u.id);

  it('낱말 유닛(word)은 L4 4 + L5 3 + L6 3 + L8 14(2음절) = 24개', () => {
    expect(wordUnitIds).toEqual([
      'zh-l4-u01',
      'zh-l4-u02',
      'zh-l4-u03',
      'zh-l4-u04',
      'zh-l5-u04',
      'zh-l5-u05',
      'zh-l5-u06',
      'zh-l6-u05',
      'zh-l6-u06',
      'zh-l6-u07',
      'zh-l8-u01',
      'zh-l8-u02',
      'zh-l8-u03',
      'zh-l8-u04',
      'zh-l8-u05',
      'zh-l8-u06',
      'zh-l8-u07',
      'zh-l8-u08',
      'zh-l8-u09',
      'zh-l8-u10',
      'zh-l8-u11',
      'zh-l8-u12',
      'zh-l8-u13',
      'zh-l8-u14',
    ]);
  });

  it('낱말 유닛 = 낱말 놀이(연습 + 그리기 + 짝 찾기), 전부 play 섹션', () => {
    for (const id of wordUnitIds) {
      expect(isWordUnit(id)).toBe(true);
      expect(isToneUnit(id)).toBe(false);
      expect(isBlendUnit(id)).toBe(false);
      const plan = getChineseActivityPlan(id);
      // 🔴 plan 에 게임 kind 가 없으면 라우트로 도달해도 죽은 코드 — 낱말 그리기·짝 찾기 포함 확인.
      //    🎵 찬트가 있는 단원(L4·L8)은 맨 끝에 chant 가 붙는다(L5·L6 낱말 유닛엔 없음).
      const gameKinds = ['word-listen-choose', 'game-connect-dots', 'game-line-matching'];
      expect(plan.activities.map((a) => a.kind)).toEqual(
        CHANT_URLS[id] ? [...gameKinds, 'chant'] : gameKinds
      );
      expect(plan.activities.every((a) => a.section === 'play')).toBe(true);
      expect(getChineseRequiredActivities(id)).toEqual(['word-practice']);
    }
  });

  it('낱말 유닛 낱말은 전부 한자·삽화 슬러그를 가진다(카드에 병기 · 삽화 매칭)', () => {
    for (const id of wordUnitIds) {
      const words = getChineseUnit(id)!.targetWords;
      expect(words.length, `${id} 낱말 없음`).toBeGreaterThan(0);
      for (const w of words) {
        const info = L4_WORDS[w.normalize('NFC')];
        expect(info, `${w} 매핑 누락`).toBeTruthy();
        expect(hanziFor(w)).toBe(info!.hanzi);
        expect(info!.slug, `${w} 슬러그 없음`).toBeTruthy();
      }
    }
  });

  // ── L5 복운모(复韵母) ─────────────────────────────────────────────────────
  // 🔴 L3 병음조합과 100% 같은 메커니즘 — blend 유닛이라 plan·카드가 같은 경로를 탄다(유닛 데이터만 추가).
  it('L5 = 복운모 blend 유닛 3개, 각 배우기 + 듣고 고르기(L3 와 동일)', () => {
    for (const id of ['zh-l5-u01', 'zh-l5-u02', 'zh-l5-u03']) {
      expect(isBlendUnit(id)).toBe(true);
      expect(isToneUnit(id)).toBe(false);
      expect(isWordUnit(id)).toBe(false);
      const plan = getChineseActivityPlan(id);
      expect(plan.activities.map((a) => a.kind)).toEqual([
        'word-listen-choose',
        'word-listen-choose',
        'chant',
      ]);
      expect(plan.activities.map((a) => a.key)).toEqual(['listen-choose', 'listen-quiz', 'chant']);
      // required 는 chant(required:false)를 안 센다.
      expect(getChineseRequiredActivities(id)).toEqual(['listen-choose', 'listen-quiz']);
    }
  });

  // 🔴 복운모 배우기 카드 = 음절 + 블렌드 3클립(성모 citation → 복운모 → 음절). 전 클립 mod_chinese 실존.
  it('복운모 배우기 카드 = 음절 라벨 + 블렌드 3클립 (ai ei ui / ao ou iu)', () => {
    expect(getChineseListenCards('zh-l5-u01')).toEqual([
      { label: 'mǎi', sound: 'mǎi', sounds: ['mō', 'ǎi', 'mǎi'] },
      { label: 'bái', sound: 'bái', sounds: ['bō', 'ái', 'bái'] },
      { label: 'bēi', sound: 'bēi', sounds: ['bō', 'ēi', 'bēi'] },
      { label: 'fēi', sound: 'fēi', sounds: ['fó', 'ēi', 'fēi'] },
      { label: 'guì', sound: 'guì', sounds: ['gē', 'uì', 'guì'] },
      { label: 'duì', sound: 'duì', sounds: ['dē', 'uì', 'duì'] },
    ]);
    expect(getChineseListenCards('zh-l5-u02')).toEqual([
      { label: 'māo', sound: 'māo', sounds: ['mō', 'āo', 'māo'] },
      { label: 'hǎo', sound: 'hǎo', sounds: ['hē', 'ǎo', 'hǎo'] },
      { label: 'gǒu', sound: 'gǒu', sounds: ['gē', 'ǒu', 'gǒu'] },
      { label: 'tóu', sound: 'tóu', sounds: ['tè', 'óu', 'tóu'] },
      // 🔴 iu(niú·liù)는 i 가 운모 첫 글자라 뒤 u 는 진짜 u — ü 로 안 바꾼다.
      { label: 'niú', sound: 'niú', sounds: ['né', 'iú', 'niú'] },
      { label: 'liù', sound: 'liù', sounds: ['lē', 'iù', 'liù'] },
    ]);
  });

  // 🔴 üe(xué·xuě)는 j/q/x 뒤 운모 첫 글자 u = 실제 ü → 클립 üé·üě(ué 는 R2 부재). ie 는 변환 없음.
  it('복운모 üe 배우기 = 운모 첫 글자 u→ü 변환 (ie üe)', () => {
    expect(getChineseListenCards('zh-l5-u03')).toEqual([
      { label: 'xiě', sound: 'xiě', sounds: ['xī', 'iě', 'xiě'] },
      { label: 'jiě', sound: 'jiě', sounds: ['jī', 'iě', 'jiě'] },
      { label: 'xué', sound: 'xué', sounds: ['xī', 'üé', 'xué'] },
      { label: 'xuě', sound: 'xuě', sounds: ['xī', 'üě', 'xuě'] },
    ]);
  });

  // ── L6 비운모(鼻韵母) ─────────────────────────────────────────────────────
  // 🔴 L3/L5 와 같은 blend 메커니즘 — 유닛 데이터만 추가, 코드 변경 0. 前鼻 2유닛 · 後鼻 2유닛.
  it('L6 = 비운모 blend 유닛 4개(前鼻 2 + 後鼻 2), 각 배우기 + 듣고 고르기', () => {
    for (const id of ['zh-l6-u01', 'zh-l6-u02', 'zh-l6-u03', 'zh-l6-u04']) {
      expect(isBlendUnit(id)).toBe(true);
      expect(isToneUnit(id)).toBe(false);
      expect(isWordUnit(id)).toBe(false);
      expect(getChineseActivityPlan(id).activities.map((a) => a.key)).toEqual([
        'listen-choose',
        'listen-quiz',
        'chant',
      ]);
    }
  });

  // 🔴 비운모 배우기 카드 = 음절 + 블렌드 3클립(성모 citation → 비운모 → 음절). bare 비운모 클립만 실존.
  //    jūn·qún = jqx 뒤 u→ü → 클립 ǖn·ǘn(ün 계열). 전 클립 mod_chinese 실존(18/18 HEAD 200 확인).
  it('비운모 배우기 카드 = 음절 라벨 + 블렌드 3클립 (an/en/in/un/ün/ang/eng/ing/ong)', () => {
    expect(getChineseListenCards('zh-l6-u01')).toEqual([
      { label: 'bàn', sound: 'bàn', sounds: ['bō', 'àn', 'bàn'] },
      { label: 'fàn', sound: 'fàn', sounds: ['fó', 'àn', 'fàn'] },
      { label: 'mén', sound: 'mén', sounds: ['mō', 'én', 'mén'] },
      { label: 'fēn', sound: 'fēn', sounds: ['fó', 'ēn', 'fēn'] },
    ]);
    // 🔴 kūn/dūn = un 그대로 / jūn·qún = jqx 뒤 u→ü (ǖn·ǘn).
    expect(getChineseListenCards('zh-l6-u02')).toEqual([
      { label: 'xīn', sound: 'xīn', sounds: ['xī', 'īn', 'xīn'] },
      { label: 'jīn', sound: 'jīn', sounds: ['jī', 'īn', 'jīn'] },
      { label: 'kūn', sound: 'kūn', sounds: ['kē', 'ūn', 'kūn'] },
      { label: 'dūn', sound: 'dūn', sounds: ['dē', 'ūn', 'dūn'] },
      { label: 'jūn', sound: 'jūn', sounds: ['jī', 'ǖn', 'jūn'] },
      { label: 'qún', sound: 'qún', sounds: ['qī', 'ǘn', 'qún'] },
    ]);
    expect(getChineseListenCards('zh-l6-u04')).toEqual([
      { label: 'xīng', sound: 'xīng', sounds: ['xī', 'īng', 'xīng'] },
      { label: 'bīng', sound: 'bīng', sounds: ['bō', 'īng', 'bīng'] },
      { label: 'hóng', sound: 'hóng', sounds: ['hē', 'óng', 'hóng'] },
      { label: 'lóng', sound: 'lóng', sounds: ['lē', 'óng', 'lóng'] },
    ]);
  });

  // ── L7 整体认读(통독 음절) ────────────────────────────────────────────────
  // 🔴 blend 가 아닌 whole — 배우기가 그 음절의 4성 시퀀스(단운모 놀이판과 같은 리듬), plan 은 blend 형(배우기+듣고 고르기).
  it('L7 = 通读 whole 유닛 5개, 각 배우기 + 듣고 고르기 (쓰기·사냥 없음)', () => {
    for (const id of ['zh-l7-u01', 'zh-l7-u02', 'zh-l7-u03', 'zh-l7-u04', 'zh-l7-u05']) {
      expect(isWholeUnit(id)).toBe(true);
      expect(isBlendUnit(id)).toBe(false);
      expect(isToneUnit(id)).toBe(false);
      expect(isWordUnit(id)).toBe(false);
      expect(getChineseActivityPlan(id).activities.map((a) => a.key)).toEqual([
        'listen-choose',
        'listen-quiz',
      ]);
    }
  });

  // 🔴 通读 배우기 카드 = whole 음절 라벨 + 그 음절 4성 시퀀스(sound=tone-1). blend 3클립 아님.
  it('通读 배우기 카드 = whole 음절 라벨 + 4성 시퀀스 (zhi chi shi ri / ye yue yuan)', () => {
    expect(getChineseListenCards('zh-l7-u01')).toEqual([
      { label: 'zhi', sound: 'zhī', sounds: ['zhī', 'zhí', 'zhǐ', 'zhì'] },
      { label: 'chi', sound: 'chī', sounds: ['chī', 'chí', 'chǐ', 'chì'] },
      { label: 'shi', sound: 'shī', sounds: ['shī', 'shí', 'shǐ', 'shì'] },
      { label: 'ri', sound: 'rī', sounds: ['rī', 'rí', 'rǐ', 'rì'] },
    ]);
    expect(getChineseListenCards('zh-l7-u04')).toEqual([
      { label: 'ye', sound: 'yē', sounds: ['yē', 'yé', 'yě', 'yè'] },
      { label: 'yue', sound: 'yuē', sounds: ['yuē', 'yué', 'yuě', 'yuè'] },
      { label: 'yuan', sound: 'yuān', sounds: ['yuān', 'yuán', 'yuǎn', 'yuàn'] },
    ]);
  });

  // ── 🎵 유닛송(찬트) 스텝 ────────────────────────────────────────────────────
  it('CHANT_URLS 는 40개 단원(복습·L7 제외), 전부 유닛 목록에 존재', () => {
    const ids = Object.keys(CHANT_URLS);
    expect(ids.length).toBe(40);
    const allIds = new Set(getAllChineseUnits().map((u) => u.id));
    for (const id of ids) expect(allIds.has(id), `${id} 없는 단원`).toBe(true);
    // 복습·L7(통독)엔 찬트가 없다.
    expect(ids.some((id) => id.endsWith('-r1'))).toBe(false);
    expect(ids.some((id) => id.startsWith('zh-l7'))).toBe(false);
  });

  // 🔴 plan 에 안 붙이면 라우트로 도달해도 죽은 코드 — CHANT 있는 단원은 마지막 활동이 chant 여야 한다.
  it('CHANT_URLS 있는 단원 = plan 마지막 활동이 chant (kind·section·required·order)', () => {
    for (const u of getAllChineseUnits()) {
      const plan = getChineseActivityPlan(u.id);
      const last = plan.activities[plan.activities.length - 1];
      if (CHANT_URLS[u.id]) {
        expect(last.kind, `${u.id} 마지막이 chant 아님`).toBe('chant');
        expect(last.key).toBe('chant');
        expect(last.section).toBe('play');
        expect(last.required).toBe(false);
        expect(last.order).toBe(plan.activities.length); // 1-based 마지막 순서
        expect(last.emoji).toBe('🎵');
      } else {
        // 복습·L7 등 CHANT 없는 단원엔 chant 활동이 없다.
        expect(
          plan.activities.some((a) => a.kind === 'chant'),
          `${u.id} 엔 chant 없어야`
        ).toBe(false);
      }
    }
  });
});
