import { flattenPhonicsUnits, type FlatPhonicsUnit } from '@tangobook/shared';
import {
  getUnitPatterns,
  patternWriteOrder,
  wordMatchesPattern,
} from '@/features/phonics-learner/lib/english-phonics-units';

/**
 * 「온라인 워크지」 칸 목록 — 인쇄 워크지(`build-worksheet.mjs`)와 **같은 구성**을 커리큘럼에서 뽑는다.
 * 쪽 순서 그대로 ① 글자 → ② 글자 만들기 → ③ 낱말. 칸마다 쓸 글자(write)와 다 쓰면 읽을 소리(sound)가 따로다.
 *
 * 🔴 워크지 규칙을 따른다(찬찬한글 근거, `build-worksheet.mjs` 주석):
 *  - 받침 단원은 받침 글자를 홑으로 쓰지 않는다 — 새로운 건 글자가 아니라 자리와 소리다.
 *  - 기본모음 단원은 자음을 아직 안 배웠으니 조합 표가 없다 · 복잡모음은 자음 14개 × 모음.
 *  - 영어 Book 1 은 대·소문자를 따로 쓰고, 낱말은 **첫 글자만** 쓴다(소리는 낱말).
 *  - 영어 Book 2~5 는 패턴 → 낱말, 낱말은 **패턴 먼저** 쓴다(앱 익히기·게임과 같은 순서).
 */
export interface WorksheetCell {
  section: string;
  /** 캔버스에 쓸 글자 */
  write: string;
  /** 다 쓰면 읽을 소리(글자·음절·낱말) */
  sound: string;
  /** 다 쓰면 보여 줄 낱말(Book 1: `a` 를 쓰면 `apple`) */
  reveal?: string;
  /** 쓰는 칸 순서(패턴 먼저) */
  order?: number[];
  /** 영어 패턴 — 이어읽기 규칙용 */
  pattern?: string;
  /** 영어 Book 1 글자 칸 — 그 글자의 몇 번째 낱말을 보여 주고 읽나(대문자 0 · 소문자 1, 앱 글자 쓰기와 같다). */
  wordSlot?: number;
  /** 몇 번 쓰나 — 한글 글자·음절은 3번, 낱말은 1번(2026-09-15 사용자). 없으면 1. */
  reps?: number;
}

/** 한글 워크지는 글자를 여러 번 따라 쓰는 게 기본이다(인쇄 워크지도 줄마다 반복 칸). */
const LETTER_REPS = 3;

const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
const JUNG = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ';
const syllable = (cho: string, jung: string) =>
  String.fromCharCode(0xac00 + (CHO.indexOf(cho) * 21 + JUNG.indexOf(jung)) * 28);
/** 복잡모음 조합 표의 자음 — 워크지 `BLEND_CONSONANTS` 와 같은 14개. */
const BLEND_CONSONANTS = [...'ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ'];

function koreanCells(u: FlatPhonicsUnit): WorksheetCell[] {
  const words = u.sampleWords.map((w) => ({ section: '낱말 쓰기', write: w, sound: w }));
  if (u.phonemes[0]?.startsWith('받침')) {
    return [
      ...u.syllables.map((s) => ({
        section: '글자 만들기',
        write: s,
        sound: s,
        reps: LETTER_REPS,
      })),
      ...words,
    ];
  }
  if (!u.syllables.length) {
    const vowels = u.phonemes;
    const letters = vowels.map((v) => ({
      section: '글자 쓰기',
      write: v,
      sound: syllable('ㅇ', v),
      reps: LETTER_REPS,
    }));
    // 기본모음 단원(모음 10개)은 자음을 아직 안 배웠다 — 조합 표 없음.
    if (vowels.length > 3) return [...letters, ...words];
    const combos = vowels.flatMap((v) =>
      BLEND_CONSONANTS.map((c) => {
        const s = syllable(c, v);
        return { section: '글자 만들기', write: s, sound: s, reps: LETTER_REPS };
      })
    );
    return [...letters, ...combos, ...words];
  }
  const letter = u.phonemes[0];
  return [
    { section: '글자 쓰기', write: letter, sound: letter, reps: LETTER_REPS },
    ...u.syllables.map((s) => ({ section: '글자 만들기', write: s, sound: s, reps: LETTER_REPS })),
    ...words,
  ];
}

function englishCells(u: FlatPhonicsUnit): WorksheetCell[] {
  if (u.levelName.startsWith('Book 1')) {
    // 🔴 **글자마다 한 묶음**(2026-09-15 사용자: 「A 따로, B 따로」) — [A · a · 그 글자 낱말들] 다음에 B.
    // 글자 칸은 **글자 소리**(a) — Book 1 의 목표는 글자다. 낱말 칸은 그 낱말 속 그 글자를 쓴다.
    // 낱말은 첫 글자로 붙이고, 첫 글자가 이 단원 글자가 아니면(x: box·fox·six) 들어 있는 글자로.
    const letterOf = (w: string) =>
      u.phonemes.find((l) => w[0].toLowerCase() === l) ??
      u.phonemes.find((l) => w.toLowerCase().includes(l));
    return u.phonemes.flatMap((l) => {
      const section = l.toUpperCase() + l;
      return [
        { section, write: l.toUpperCase(), sound: l, wordSlot: 0 },
        { section, write: l, sound: l, wordSlot: 1 },
        ...u.sampleWords
          .filter((w) => letterOf(w) === l)
          .map((w) => ({ section, write: l, sound: w, reveal: w })),
      ];
    });
  }
  const patterns = getUnitPatterns(u.id);
  return [
    ...u.patterns.map((p) => {
      const core = p.replace(/^[-_]+|[-_]+$/g, '');
      return { section: '소리 덩이 쓰기', write: core, sound: core };
    }),
    ...u.sampleWords.map((w) => ({
      section: '낱말 쓰기',
      write: w,
      sound: w,
      order: patternWriteOrder(w, patterns),
      pattern: patterns.find((p) => wordMatchesPattern(w, p)),
    })),
  ];
}

export function worksheetCells(track: 'korean' | 'english', unitId: string): WorksheetCell[] {
  const u = flattenPhonicsUnits(track).find((x) => x.id === unitId);
  if (!u) return [];
  return track === 'korean' ? koreanCells(u) : englishCells(u);
}
