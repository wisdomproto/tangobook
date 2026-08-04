/**
 * 영어 파닉스 학습자 메타 — 한글의 평행 구조.
 *
 * 데이터 source: `ENGLISH_PHONICS_CURRICULUM` (`@tangobook/shared`).
 * R2 storybook ID 는 `en-bN-uMM` 형식 (zero-pad).
 *
 * 활동 plan = **Book 1~5 전 권**(2026-07-31). Book 1=알파벳 / Book 2=CVC 「배우기」·「써보기」/패턴 /
 *   Book 3~5=**패턴(`_ake`·`bl_`·`ee`)마다 낱말가족 배우기(Listen and repeat)+써보기(낱말 쓰기)** + 게임 3종. 복습은 전 권.
 * 데이터(단어 그림·keypoints·wordFamilies TTS)는 Book 3~5 도 완비 — ABC 나무 카드 연동 + TTS 백필 덕분.
 */
import { ENGLISH_PHONICS_CURRICULUM } from '@tangobook/shared';
import type { ActivityPlan, ActivityDef, ReviewCard } from './korean-phonics-units';

export interface EnglishUnitSummary {
  id: string; // 'en-b1-u01'
  levelKey: string; // 'book1'
  levelName: string; // 'Book 1: Single Letter Sounds'
  levelIndex: number; // 1
  unitIndexInLevel: number;
  unitTitle: string; // 'Unit 01: Aa Bb Cc'
  phonemes: string[];
  /** 철자 패턴(`_ake`·`bl_`·`ee`) — Book 3·4·5 익히기를 패턴별로 나눈다. */
  patterns: string[];
  targetWords: string[];
  /** 복습 단원인가 (커리큘럼에 없는 파생 단원). */
  isReview?: boolean;
  /** 복습 단원이 되짚는 학습 단원 ID 들. */
  coveredUnitIds?: string[];
}

/** 커리큘럼 단원만 (복습 제외). */
function getCurriculumUnits(): EnglishUnitSummary[] {
  const out: EnglishUnitSummary[] = [];
  for (const level of ENGLISH_PHONICS_CURRICULUM) {
    const levelIndex = Number(String(level.level).replace(/\D/g, '')) || 0;
    for (let i = 0; i < level.units.length; i++) {
      const u = level.units[i];
      out.push({
        id: u.id,
        levelKey: String(level.level),
        levelName: level.name,
        levelIndex,
        unitIndexInLevel: i + 1,
        unitTitle: u.title,
        phonemes: [...u.phonemes],
        patterns: [...(u.patterns ?? [])],
        targetWords: [...(u.sampleWords ?? [])],
      });
    }
  }
  return out;
}

/**
 * 🔴 복습 묶음이 **2단원**이다 (한글은 4단원).
 * 영어는 한 단원이 글자·패턴을 3~4개씩 안고 있어서, 4단원을 묶으면 복습 화면에 카드가 12~14장 깔린다.
 * 2단원이면 5~8장으로 한글 복습과 비슷한 밀도가 된다.
 */
const REVIEW_CHUNK = 2;
const MAX_REVIEW_CARDS = 8;

/** 활동 plan 이 있는 레벨만 복습을 만든다(전 권). Book 3~5 는 낱말 기반 복습. */
function reviewableLevels(): string[] {
  return ['book1', 'book2', 'book3', 'book4', 'book5'];
}

/**
 * 모든 영어 unit + 복습 단원을 학습 순서대로.
 * 복습은 그 묶음 마지막 단원 **뒤에** 끼어든다 (사이드바에서 단원처럼 보인다).
 */
export function getAllEnglishUnits(): EnglishUnitSummary[] {
  const curriculum = getCurriculumUnits();
  const out: EnglishUnitSummary[] = [];
  const reviewable = reviewableLevels();

  for (const level of ENGLISH_PHONICS_CURRICULUM) {
    const levelKey = String(level.level);
    const levelUnits = curriculum.filter((u) => u.levelKey === levelKey);
    const reviewAfter = new Map<string, EnglishUnitSummary>();

    if (reviewable.includes(levelKey)) {
      const groups: EnglishUnitSummary[][] = [];
      for (let i = 0; i < levelUnits.length; i += REVIEW_CHUNK) {
        groups.push(levelUnits.slice(i, i + REVIEW_CHUNK));
      }
      // 🔴 꼬리가 1 단원이면 앞 묶음에 병합(단독 복습 방지) — Book 3 은 7단원이라 홀로 남는다.
      if (groups.length >= 2 && groups[groups.length - 1].length < 2) {
        const tail = groups.pop()!;
        groups[groups.length - 1].push(...tail);
      }
      groups.forEach((group, gi) => {
        const last = group[group.length - 1];
        // 🔴 중복 제거 — Book 3 은 두 단원이 같은 phoneme(long-a)일 수 있어 "long-a~long-a" 가 됐다.
        const letters = [...new Set(group.flatMap((u) => u.phonemes))];
        reviewAfter.set(last.id, {
          id: `en-b${last.levelIndex}-r${gi + 1}`,
          levelKey,
          levelName: level.name,
          levelIndex: last.levelIndex,
          unitIndexInLevel: last.unitIndexInLevel,
          // 한글과 같은 이유로 번호가 아니라 되짚는 글자 범위 (`Review 1` 은 무엇을 되짚는지 안 알려준다).
          unitTitle:
            letters.length > 1
              ? `${letters[0]}~${letters[letters.length - 1]} 복습`
              : `${letters[0] ?? ''} 복습`.trim(),
          phonemes: letters,
          patterns: [],
          targetWords: group.flatMap((u) => u.targetWords),
          isReview: true,
          coveredUnitIds: group.map((u) => u.id),
        });
      });
    }

    for (const u of levelUnits) {
      out.push(u);
      const review = reviewAfter.get(u.id);
      if (review) out.push(review);
    }
  }
  return out;
}

export function getEnglishUnit(unitId: string): EnglishUnitSummary | undefined {
  return getAllEnglishUnits().find((u) => u.id === unitId);
}

// ─── Book 2 CVC plan generator ───
// 한 unit 의 VC 패턴들 → 활동 plan (각 패턴 learn + write 2개 + 게임 4종)
interface VcPattern {
  vowel: string;
  consonant: string;
  vc: string;
}

function makeBook2UnitPlan(patterns: readonly VcPattern[]): ActivityPlan {
  const activities: import('./korean-phonics-units').ActivityDef[] = [];
  let order = 1;
  for (const p of patterns) {
    /**
     * 1 활동 / VC — CvcPatternLearn 하나가 Phase A (배우기) → B (단어) → C (써보기)까지 흐른다.
     * 🔴 **써보기를 별도 카드로 두지 않는다**(2026-08-04 사용자: "배우기랑 써보기를 합치자,
     *    배우기 다음에 써보기 나오는 걸로"). 2026-07-29 엔 「목록에 쓰기가 안 보인다」고 별도 카드를
     *    뒀는데, 배우기 카드가 이미 마지막 Phase C 에서 `${vc} 써보기` 화면으로 이어지므로 중복이었다
     *    (같은 쓰기를 두 번). 배우기 하나로 합쳐 배우기→단어→써보기를 한 흐름으로 둔다.
     *    (`cvc-pattern-write` 컴포넌트/kind 는 보존 — 호스트 분기는 남겨 두되 plan 에서만 뺀다.)
     */
    activities.push({
      key: `cvc-${p.vc}`,
      order: order++,
      kind: 'cvc-pattern-learn',
      section: 'learn',
      title: `${p.vc} 배우기`,
      emoji: '🔤',
      required: true,
      cvcPattern: { ...p },
    });
  }
  // 4 games — 패턴 단어 풀에서 랜덤 4개
  activities.push(
    {
      key: 'game-english-block',
      order: order++,
      kind: 'game-english-block',
      section: 'play',
      title: '영어 블록 게임',
      emoji: '🧩',
      required: false,
    },
    {
      key: 'game-word-writing',
      order: order++,
      kind: 'game-word-writing',
      section: 'play',
      title: '낱말 쓰기',
      emoji: '🖍️',
      required: false,
    },
    {
      key: 'game-dots',
      order: order++,
      kind: 'game-connect-dots',
      section: 'play',
      title: '낱말 그리기',
      emoji: '🔵',
      required: false,
    },
    {
      key: 'game-line-matching',
      order: order,
      kind: 'game-line-matching',
      section: 'play',
      title: '그림 짝 찾기',
      emoji: '🔗',
      required: false,
    }
  );
  return { activities };
}

// ─── Book 1 plan generator (Single Letter Sounds — A·B·C 한 글자씩) ───
// blending[i] = { vowel: 'A', consonant: 'a', blend: 'Aa', exampleWord: 'apple', illustrationUrl, ... }
// wordFamilies[i].words[].hotspots 로 핫스팟 음원 재생.

function makeBook1UnitPlan(letters: readonly string[]): ActivityPlan {
  const activities: import('./korean-phonics-units').ActivityDef[] = [];
  let order = 1;
  // 알파벳 배우기 — unit 내 모든 글자를 한 활동에서 상단 탭으로 전환.
  // 써보기는 별도 카드 X — 학습 페이지 안 "✏️ Aa 써보기" 버튼 → 모달로 통합.
  // title 예: "ABC 배우기" / "STUV 배우기" — 대문자만 명시적으로.
  const letterListLabel = letters.map((L) => L.toUpperCase()).join('');
  activities.push({
    key: 'letters-learn',
    order: order++,
    kind: 'alphabet-letter-learn',
    section: 'learn',
    title: `${letterListLabel} 배우기 1`,
    emoji: '🔤',
    required: true,
    letters,
  });
  // 🔊 듣고 고르기 — 🔴 Book 1 은 **알파벳이 학습 목표**라 보기에 단어 철자를 쓰지 않는다.
  // (apple 을 읽으라는 건 아직 못 하는 일이다. 소리 → 알파벳 카드만 고른다.)
  activities.push({
    key: 'word-listen-choose',
    order: order++,
    kind: 'word-listen-choose',
    section: 'learn',
    title: `${letterListLabel} 배우기 2`,
    emoji: '🔊',
    required: true,
    letters,
  });
  // ✏️ 글자 쓰기 — 대문자·소문자 캔버스 두 개. 배우기 화면 안 「써보기」 모달과 같은 일을 하지만,
  //    단원 목록에 카드로 서야 아이가 「쓰는 차례」를 안다(한글 단원과 같은 모양).
  activities.push({
    key: 'letters-write',
    order: order++,
    kind: 'alphabet-letter-write',
    section: 'learn',
    title: `${letterListLabel} 써보기`,
    emoji: '✏️',
    required: true,
    letters,
  });
  // 4 games — wordFamilies 안 모든 단어 풀에서 어댑터가 픽업
  activities.push(
    /**
     * 🔴 **Book 1 에는 영어 블록 게임을 두지 않는다**(2026-07-29 사용자 지시).
     *    이 권은 글자가 단위라 블록이 **한 칸**이고, 그 한 칸을 채우는 일은 바로 앞 「배우기 2」
     *    (듣고 고르기)가 이미 시킨다 — 같은 과제를 게임 이름만 바꿔 한 번 더 하는 셈이었다.
     *    Book 2 부터는 낱말을 통째로 조립하므로 그대로 둔다.
     */
    {
      key: 'game-word-writing',
      order: order++,
      kind: 'game-word-writing',
      section: 'play',
      title: '낱말 쓰기',
      emoji: '🖍️',
      required: false,
    },
    {
      key: 'game-dots',
      order: order++,
      kind: 'game-connect-dots',
      section: 'play',
      title: '낱말 그리기',
      emoji: '🔵',
      required: false,
    },
    {
      key: 'game-line-matching',
      order: order,
      kind: 'game-line-matching',
      section: 'play',
      title: '그림 짝 찾기',
      emoji: '🔗',
      required: false,
    }
  );
  return { activities };
}

// ─── Book 3·4·5 plan generator (낱말 단위 — Magic-e / 블렌드 / 모음팀) ───
/**
 * 🔴 **Book 3·4·5 는 낱말 기반 재사용 플랜**(2026-07-31). 이 권들은 철자 패턴이 저마다 달라서
 *    (Magic-e 라임 `_ake` · 앞 블렌드 `bl_` · 모음팀 `ee`) Book 2 의 CVC 전용 「배우기」가 안 맞는다.
 *    데이터(단어 그림·keypoints·wordFamilies TTS)는 이미 완비돼 있으므로, **기존 컴포넌트만 재사용**해
 *    먼저 연다: 듣고 고르기(낱말) + 게임 4종. 패턴 개념을 가르치는 전용 「배우기」는 후속.
 *  - `word-listen-choose` 는 `letters` 를 안 넘긴다 → 호스트가 **낱말 기반 분기**로 렌더한다
 *    (Book 1 은 `letters` 가 있어 알파벳 분기).
 */
/** 패턴 표기 — `_ake`→`-ake`(끝) · `bl_`→`bl-`(앞) · `ee`→`ee`(포함). 카드 제목/매칭에 쓴다. */
export function patternLabel(p: string): string {
  const core = p.replace(/_/g, '');
  if (p.startsWith('_')) return `-${core}`;
  if (p.endsWith('_')) return `${core}-`;
  return core;
}

/** 낱말이 그 철자 패턴에 속하나 — `_x`=끝소리 / `x_`=첫소리 / `x`=포함. */
export function wordMatchesPattern(word: string, pattern: string): boolean {
  const core = pattern.replace(/_/g, '').toLowerCase();
  if (!core) return false;
  const w = word.toLowerCase();
  if (pattern.startsWith('_')) return w.endsWith(core);
  if (pattern.endsWith('_')) return w.startsWith(core);
  return w.includes(core);
}

/**
 * 낱말 안에서 **공통 철자 패턴이 앉는 자리** `[start, end)` — 배우기에서 그 글자만 코랄로 강조한다.
 * `_ake`→끝(bake 의 1~4) · `bl_`→앞(black 의 0~2) · `ee`→처음 나오는 위치(feet 의 1~3).
 * 매칭이 안 되면 `[0, 0]`(강조 없음).
 */
export function patternHighlight(word: string, pattern: string): [number, number] {
  const core = pattern.replace(/_/g, '').toLowerCase();
  const w = word.toLowerCase();
  if (!core) return [0, 0];
  if (pattern.startsWith('_'))
    return w.endsWith(core) ? [w.length - core.length, w.length] : [0, 0];
  if (pattern.endsWith('_')) return w.startsWith(core) ? [0, core.length] : [0, 0];
  const i = w.indexOf(core);
  return i >= 0 ? [i, i + core.length] : [0, 0];
}

/**
 * 🔴 **Book 3·4·5 익히기 = 패턴마다 배우기 + 써보기**(2026-07-31 사용자 "북2 참고해서 익히기 늘려").
 *    Book 2 가 VC 패턴마다 `배우기`+`써보기` 를 두듯, 여기도 커리큘럼 패턴(`_ake`·`bl_`·`ee`)마다
 *    **낱말가족 배우기(`word-family-learn`, Listen and repeat) + 낱말 쓰기(써보기)** — 둘 다 `pattern` 을
 *    달고 호스트가 그 패턴 낱말만 고른다. 배우기는 처음엔 듣고 고르기 퀴즈였으나 이퓨처 §4(Learn=
 *    Listen and repeat) 대로 교정(2026-08-01, `WordFamilyLearnActivity`). 나머지 게임은 단원 전체.
 */
function makeWordUnitPlan(unit: EnglishUnitSummary): ActivityPlan {
  const activities: ActivityDef[] = [];
  let order = 1;
  for (const p of unit.patterns) {
    const label = patternLabel(p);
    activities.push({ key: `learn-${p}`, order: order++, kind: 'word-family-learn', section: 'learn', title: `${label} 배우기`, emoji: '🔊', required: true, pattern: p }); // prettier-ignore
    activities.push({ key: `write-${p}`, order: order++, kind: 'game-word-writing', section: 'learn', title: `${label} 써보기`, emoji: '🖍️', required: false, pattern: p }); // prettier-ignore
  }
  activities.push(
    { key: 'game-english-block', order: order++, kind: 'game-english-block', section: 'play', title: '블록 게임', emoji: '🧩', required: false }, // prettier-ignore
    { key: 'game-dots', order: order++, kind: 'game-connect-dots', section: 'play', title: '낱말 그리기', emoji: '🔵', required: false }, // prettier-ignore
    { key: 'game-line-matching', order, kind: 'game-line-matching', section: 'play', title: '그림 짝 찾기', emoji: '🔗', required: false } // prettier-ignore
  );
  return { activities };
}

// Book 1 unit → 글자 (storybook title 과 일치)
const BOOK1_LETTERS: Record<string, readonly string[]> = {
  'en-b1-u01': ['A', 'B', 'C'],
  'en-b1-u02': ['D', 'E', 'F'],
  'en-b1-u03': ['G', 'H', 'I'],
  'en-b1-u04': ['J', 'K', 'L'],
  'en-b1-u05': ['M', 'N', 'O'],
  'en-b1-u06': ['P', 'Q', 'R'],
  'en-b1-u07': ['S', 'T', 'U', 'V'],
  'en-b1-u08': ['W', 'X', 'Y', 'Z'],
};

// Book 2 (Short Vowels) 8 unit — R2 phonicsConfig.targetPatterns 와 매칭. 단어 자동 추출 (flashcards.phonicPattern).
const BOOK2_PATTERNS: Record<string, readonly VcPattern[]> = {
  'en-b2-u01': [
    { vowel: 'a', consonant: 'n', vc: 'an' },
    { vowel: 'a', consonant: 't', vc: 'at' },
  ],
  'en-b2-u02': [
    { vowel: 'a', consonant: 'p', vc: 'ap' },
    { vowel: 'a', consonant: 'd', vc: 'ad' },
    { vowel: 'a', consonant: 'm', vc: 'am' },
  ],
  'en-b2-u03': [
    { vowel: 'i', consonant: 'p', vc: 'ip' },
    { vowel: 'i', consonant: 't', vc: 'it' },
    { vowel: 'i', consonant: 'x', vc: 'ix' },
  ],
  'en-b2-u04': [
    { vowel: 'i', consonant: 'b', vc: 'ib' },
    { vowel: 'i', consonant: 'd', vc: 'id' },
    { vowel: 'i', consonant: 'g', vc: 'ig' },
    { vowel: 'i', consonant: 'n', vc: 'in' },
  ],
  'en-b2-u05': [
    { vowel: 'e', consonant: 't', vc: 'et' },
    { vowel: 'e', consonant: 'd', vc: 'ed' },
    { vowel: 'e', consonant: 'n', vc: 'en' },
  ],
  'en-b2-u06': [
    { vowel: 'o', consonant: 'g', vc: 'og' },
    { vowel: 'o', consonant: 'p', vc: 'op' },
    { vowel: 'o', consonant: 't', vc: 'ot' },
    { vowel: 'o', consonant: 'x', vc: 'ox' },
  ],
  'en-b2-u07': [
    { vowel: 'u', consonant: 'g', vc: 'ug' },
    { vowel: 'u', consonant: 'b', vc: 'ub' },
    { vowel: 'u', consonant: 'p', vc: 'up' },
  ],
  'en-b2-u08': [
    { vowel: 'u', consonant: 'n', vc: 'un' },
    { vowel: 'u', consonant: 'd', vc: 'ud' },
    { vowel: 'u', consonant: 't', vc: 'ut' },
  ],
};

// ─── 복습 단원 ───
/**
 * 되짚는 단원 → 복습 카드들.
 * Book 1 = 알파벳(대문자 크게 + 소문자 작게, 소리는 음가) / Book 2 = VC 패턴(`an`, `at` …).
 */
function reviewCardsFor(unitId: string): ReviewCard[] {
  const letters = BOOK1_LETTERS[unitId];
  if (letters) {
    return letters.map((L) => ({
      unitId,
      letter: L.toUpperCase(),
      syllable: L.toLowerCase(),
      sound: L.toLowerCase(),
      matchPosition: 'cho' as const, // 영어는 자리 개념을 안 쓴다 (한글 전용 필드)
    }));
  }
  const patterns = BOOK2_PATTERNS[unitId];
  if (patterns) {
    return patterns.map((p) => ({
      unitId,
      letter: p.vc,
      // 🔴 빈 문자열이면 안 된다 — 보기 라벨이자 카드 식별자로 쓰여서, 넷 다 '' 이면
      //    어느 카드를 눌러도 정답이 된다(빈 카드 4장 + React 중복 key).
      syllable: p.vc,
      sound: p.vc,
      matchPosition: 'cho' as const,
    }));
  }
  // 🔴 **Book 3·4·5 = 낱말 카드**(2026-07-31). 이 권들은 철자 패턴(`_ake`·`bl_`·`ee`)이 저마다 달라
  //    "글자/패턴 하나" 로 복습 카드를 만들기 어렵다. 대신 커리큘럼 낱말을 그대로 카드로 쓴다 —
  //    `letter === word` 라 `pickWord`(startsWith)가 그 낱말을 정확히 집고, Book 2 복습 분기(낱말↔그림)가
  //    그대로 동작한다(별도 호스트 분기 없이). 소리에 의존하는 「듣고 …」·글자 사냥은 plan 에서 뺀다.
  const unit = getCurriculumUnits().find((u) => u.id === unitId);
  if (
    unit &&
    (unit.levelKey === 'book3' || unit.levelKey === 'book4' || unit.levelKey === 'book5')
  ) {
    // 🔴 단원당 앞 4개만 — 복습은 2단원(또는 3)을 묶는데 한 단원이 8~16낱말이라, 전부 넣으면
    //    slice(0,8) 에서 **첫 단원만** 담긴다(둘째 단원이 사라진다). 4개씩이면 두 단원이 다 들어온다.
    return unit.targetWords.slice(0, 4).map((w) => ({
      unitId,
      letter: w,
      syllable: w,
      sound: w,
      matchPosition: 'cho' as const,
    }));
  }
  return [];
}

/**
 * 영어 복습 plan — 한글과 같은 활동군(단어 카드가 붙은 뒤 2종 → 6종으로 늘렸다).
 * 순서는 듣기와 눈 활동을 번갈아 — 듣기 둘을 붙여 놓으면 한 활동을 두 번 하는 걸로 느낀다.
 *
 * 🔴 **Book 1 에선 「듣고 낱말」을 뺀다**(2026-07-31 사용자: "5번 듣고 낱말도 알파벳 맞추기라 3번이랑 겹쳐").
 *    Book 1 은 글자가 단위라 「듣고 낱말」(낱말 소리 → 첫 글자)도 화면·과제가 「듣고 글자」(#3)와 똑같이
 *    "🔊 듣고 알파벳 고르기"가 되고, 학습 「배우기 2」(낱말 듣고 글자)와도 겹친다. #3(낱소리 → 글자)만 남긴다.
 *    Book 2 는 「듣고 글자」=패턴(`an`) / 「듣고 낱말」=낱말(`can`)+그림이라 서로 다르므로 둘 다 유지(6종).
 * 🔴 **Book 3·4·5 = 낱말 시각 복습 3종만**(2026-07-31): 카드가 낱말(`letter===word`)이라 글자 사냥·듣고
 *    글자(글자 활동)는 안 맞고, 「듣고 …」는 소리에 의존하는데 일부 낱말이 재생시점 concat 무음이 될 수
 *    있어 뺀다. 낱말↔그림 시각 활동(뒤집기·그림짝·낱말쓰기)만 남긴다 — 소리는 있으면 보너스.
 */
function makeEnglishReviewPlan(cards: readonly ReviewCard[], levelKey: string): ActivityPlan {
  const shared = { required: true, reviewCards: cards, section: 'play' as const };
  const all: ActivityDef[] = [
    {
      key: 'letter-hunt',
      order: 0,
      kind: 'letter-hunt',
      title: '글자 사냥',
      emoji: '🔎',
      ...shared,
    },
    {
      key: 'review-flip',
      order: 0,
      kind: 'review-flip',
      title: '뒤집기 짝 맞추기',
      emoji: '🎴',
      ...shared,
    },
    {
      key: 'review-syllable-listen',
      order: 0,
      kind: 'review-syllable-listen',
      title: '듣고 글자 맞추기',
      emoji: '🎧',
      ...shared,
    },
    {
      key: 'review-match',
      order: 0,
      kind: 'review-match',
      title: '그림 짝 찾기',
      emoji: '🔗',
      ...shared,
    },
    {
      key: 'review-word-listen',
      order: 0,
      kind: 'review-word-listen',
      title: '듣고 낱말 맞추기',
      emoji: '🔊',
      ...shared,
    },
    {
      key: 'review-write',
      order: 0,
      kind: 'review-write',
      title: '글자 쓰기',
      emoji: '✏️',
      ...shared,
    },
  ];
  const isWordReview = levelKey === 'book3' || levelKey === 'book4' || levelKey === 'book5';
  const WORD_KINDS = new Set(['review-flip', 'review-match', 'review-write']);
  const activities = all
    .filter((a) => {
      if (isWordReview) return WORD_KINDS.has(a.kind); // 낱말 시각 3종만
      return !(levelKey === 'book1' && a.kind === 'review-word-listen'); // Book 1 은 듣고 낱말 제외
    })
    .map((a, i) => ({ ...a, order: i + 1 }));
  return { activities };
}

function englishReviewPlans(): Record<string, ActivityPlan> {
  const out: Record<string, ActivityPlan> = {};
  for (const u of getAllEnglishUnits()) {
    if (!u.isReview) continue;
    const cards = (u.coveredUnitIds ?? []).flatMap(reviewCardsFor).slice(0, MAX_REVIEW_CARDS);
    if (cards.length) out[u.id] = makeEnglishReviewPlan(cards, u.levelKey);
  }
  return out;
}

// Book 3·4·5 단원 — 커리큘럼에서 파생(목록을 두 번 적지 않는다). 패턴별 배우기·써보기라 unit 을 넘긴다.
const BOOK345_UNITS = getCurriculumUnits().filter(
  (u) => u.levelKey === 'book3' || u.levelKey === 'book4' || u.levelKey === 'book5'
);

export const ENGLISH_UNIT_ACTIVITY_PLAN: Record<string, ActivityPlan> = {
  ...Object.fromEntries(
    Object.entries(BOOK1_LETTERS).map(([unitId, letters]) => [unitId, makeBook1UnitPlan(letters)])
  ),
  ...Object.fromEntries(
    Object.entries(BOOK2_PATTERNS).map(([unitId, patterns]) => [
      unitId,
      makeBook2UnitPlan(patterns),
    ])
  ),
  // Book 3·4·5 — 패턴별 배우기·써보기 + 게임 3종.
  ...Object.fromEntries(BOOK345_UNITS.map((u) => [u.id, makeWordUnitPlan(u)])),
  ...englishReviewPlans(),
};

export function getEnglishActivityPlan(unitId: string): ActivityPlan {
  return ENGLISH_UNIT_ACTIVITY_PLAN[unitId] ?? { activities: [] };
}

export function getEnglishRequiredActivities(unitId: string): readonly string[] {
  return getEnglishActivityPlan(unitId)
    .activities.filter((a) => a.required)
    .map((a) => a.key);
}
