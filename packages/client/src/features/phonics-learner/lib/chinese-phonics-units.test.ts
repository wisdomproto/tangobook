import { describe, it, expect } from 'vitest';
import {
  getAllChineseUnits,
  getChineseActivityPlan,
  getChineseListenCards,
  getChineseRequiredActivities,
  getChineseToneChoiceCards,
  getChineseUnit,
  getChineseUnitCards,
  hanziFor,
  isBlendUnit,
  isInitialUnit,
  isToneUnit,
  isWordUnit,
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
      'zh-l4-u01',
      'zh-l4-u02',
      'zh-l4-u03',
      'zh-l5-u01',
      'zh-l5-u02',
      'zh-l5-u03',
      'zh-l6-u01',
      'zh-l6-u02',
      'zh-l6-u03',
      'zh-l6-u04',
    ]);
    // 🔴 L1 첫 유닛 = 성조, 나머지 둘 = 단운모. L2 는 전부 성모. L3 는 전부 병음조합(blend).
    expect(isToneUnit('zh-l1-u01')).toBe(true);
    expect(isToneUnit('zh-l1-u02')).toBe(false);
    expect(isInitialUnit('zh-l1-u02')).toBe(false);
    expect(isInitialUnit('zh-l2-u01')).toBe(true);
    expect(isToneUnit('zh-l2-u01')).toBe(false);
    expect(isBlendUnit('zh-l3-u01')).toBe(true);
    expect(isBlendUnit('zh-l2-u01')).toBe(false);
    expect(isBlendUnit('zh-l1-u01')).toBe(false);
    // L5 복운모·L6 비운모도 블렌드(같은 메커니즘).
    expect(isBlendUnit('zh-l5-u01')).toBe(true);
    expect(isBlendUnit('zh-l6-u01')).toBe(true);
    expect(isBlendUnit('zh-l6-u04')).toBe(true);
  });

  // 🔴 plan 이 없으면 라우트로 도달해도 죽은 코드 — 모든 유닛이 도달 가능한 plan(첫 활동 word-listen-choose)을 갖는지.
  it('모든 유닛의 plan 첫 활동 = 듣기/낱말 연습(word-listen-choose, required)', () => {
    for (const u of getAllChineseUnits()) {
      const plan = getChineseActivityPlan(u.id);
      expect(plan.activities.length).toBeGreaterThan(0);
      expect(plan.activities[0].kind).toBe('word-listen-choose');
      // 소리 유닛(L1~L3)=listen-choose / 단어 유닛(L4)=word-practice — 둘 다 required 로 도달 가능.
      const requiredKey = isWordUnit(u.id) ? 'word-practice' : 'listen-choose';
      expect(getChineseRequiredActivities(u.id)).toContain(requiredKey);
    }
  });

  it('성조 유닛(u01) = 듣고 배우기 + 성조 듣고 고르기', () => {
    const plan = getChineseActivityPlan('zh-l1-u01');
    expect(plan.activities.map((a) => a.kind)).toEqual([
      'word-listen-choose',
      'word-listen-choose',
    ]);
    expect(plan.activities.map((a) => a.key)).toEqual(['listen-choose', 'tone-choose']);
  });

  it('단운모 유닛(u02·u03) = 듣고 배우기 + 따라쓰기 + 글자 사냥', () => {
    for (const id of ['zh-l1-u02', 'zh-l1-u03']) {
      const kinds = getChineseActivityPlan(id).activities.map((a) => a.kind);
      expect(kinds).toEqual(['word-listen-choose', 'vowel-write', 'letter-hunt']);
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
      expect(kinds).toEqual(['word-listen-choose', 'vowel-write', 'letter-hunt']);
    }
  });

  // 🔴 zh/ch/sh 2글자 성모 유닛 = LetterFillCanvas 못 씀 → 따라쓰기 생략(배우기·사냥만).
  it('권설 성모 유닛(u06) = 배우기 + 글자 사냥(따라쓰기 없음)', () => {
    const kinds = getChineseActivityPlan('zh-l2-u06').activities.map((a) => a.kind);
    expect(kinds).toEqual(['word-listen-choose', 'letter-hunt']);
    expect(getChineseUnitCards('zh-l2-u06').map((c) => c.label)).toEqual(['zh', 'ch', 'sh', 'r']);
    expect(getChineseUnitCards('zh-l2-u06').map((c) => c.sound)).toEqual([
      'zhī',
      'chī',
      'shī',
      'rì',
    ]);
  });

  // ── L3 병음조합(拼读) ──────────────────────────────────────────────────────
  // 🔴 plan = 배우기(listen-choose, 블렌드 탐색) + 듣고 고르기(listen-quiz, 음절 퀴즈). 둘 다 word-listen-choose.
  it('병음조합 4유닛 = 배우기 + 듣고 고르기(둘 다 word-listen-choose)', () => {
    for (const id of ['zh-l3-u01', 'zh-l3-u02', 'zh-l3-u03', 'zh-l3-u04']) {
      const plan = getChineseActivityPlan(id);
      expect(plan.activities.map((a) => a.kind)).toEqual([
        'word-listen-choose',
        'word-listen-choose',
      ]);
      expect(plan.activities.map((a) => a.key)).toEqual(['listen-choose', 'listen-quiz']);
      expect(getChineseRequiredActivities(id)).toEqual(['listen-choose', 'listen-quiz']);
    }
  });

  // 🔴 배우기 카드 = 음절 + 블렌드 3클립(성모 citation → 운모 → 음절). 소리는 라이브러리 직행(HEAD 200 확인).
  it('병음조합 배우기 카드 = 음절 라벨 + 블렌드 3클립', () => {
    expect(getChineseListenCards('zh-l3-u01')).toEqual([
      { label: 'bā', sound: 'bā', sounds: ['bō', 'ā', 'bā'] },
      { label: 'pí', sound: 'pí', sounds: ['pō', 'í', 'pí'] },
      { label: 'mā', sound: 'mā', sounds: ['mō', 'ā', 'mā'] },
      { label: 'fā', sound: 'fā', sounds: ['fó', 'ā', 'fā'] },
    ]);
    // d/t/n/l citation 은 fó·tè·né 처럼 비-1성 섞임(L2 매핑). 운모는 음절 성조 그대로.
    expect(getChineseListenCards('zh-l3-u02')).toEqual([
      { label: 'dà', sound: 'dà', sounds: ['dē', 'à', 'dà'] },
      { label: 'tù', sound: 'tù', sounds: ['tè', 'ù', 'tù'] },
      { label: 'nǐ', sound: 'nǐ', sounds: ['né', 'ǐ', 'nǐ'] },
      { label: 'lù', sound: 'lù', sounds: ['lē', 'ù', 'lù'] },
    ]);
    // 🔴 j/q/x + u 표기 = 실제 ü → 운모 클립은 ü 계열(jú→ǘ · xǔ→ǚ). i 운모(qí·xǐ)는 그대로.
    expect(getChineseListenCards('zh-l3-u04')).toEqual([
      { label: 'jú', sound: 'jú', sounds: ['jī', 'ǘ', 'jú'] },
      { label: 'qí', sound: 'qí', sounds: ['qī', 'í', 'qí'] },
      { label: 'xǐ', sound: 'xǐ', sounds: ['xī', 'ǐ', 'xǐ'] },
      { label: 'xǔ', sound: 'xǔ', sounds: ['xī', 'ǚ', 'xǔ'] },
    ]);
  });

  // ── L4 단어(单词) ─────────────────────────────────────────────────────────
  it('L4 = 단어 유닛(word) 3개, 각 낱말 놀이(연습 + 그리기 + 짝 찾기)', () => {
    for (const id of ['zh-l4-u01', 'zh-l4-u02', 'zh-l4-u03']) {
      expect(isWordUnit(id)).toBe(true);
      expect(isToneUnit(id)).toBe(false);
      expect(isBlendUnit(id)).toBe(false);
      const plan = getChineseActivityPlan(id);
      // 🔴 plan 에 게임 kind 가 없으면 라우트로 도달해도 죽은 코드 — 낱말 그리기·짝 찾기 포함 확인.
      expect(plan.activities.map((a) => a.kind)).toEqual([
        'word-listen-choose',
        'game-connect-dots',
        'game-line-matching',
      ]);
      // 전부 「낱말 놀이」 섹션(익히기 없음 — 소리는 L1~L3 에서 배웠다).
      expect(plan.activities.every((a) => a.section === 'play')).toBe(true);
      expect(getChineseRequiredActivities(id)).toEqual(['word-practice']);
    }
  });

  it('L4 낱말은 전부 한자·삽화 슬러그를 가진다(카드에 병기 · 삽화 매칭)', () => {
    for (const id of ['zh-l4-u01', 'zh-l4-u02', 'zh-l4-u03']) {
      const words = getChineseUnit(id)!.targetWords;
      for (const w of words) {
        const info = L4_WORDS[w.normalize('NFC')];
        expect(info, `${w} 매핑 누락`).toBeTruthy();
        expect(hanziFor(w)).toBe(info.hanzi);
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
      ]);
      expect(plan.activities.map((a) => a.key)).toEqual(['listen-choose', 'listen-quiz']);
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
});
