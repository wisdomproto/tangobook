import { KOREAN_PHONICS_CURRICULUM, decomposeHangul, isHangulSyllable } from '@tangobook/shared';

export interface KoreanPhonicsCell {
  /** 행 헤더 값 — 기본 레벨은 자음, 받침 레벨은 받침. */
  row: string;
  /** 열 헤더 값 — 기본 레벨은 모음, 받침 레벨은 초성. */
  col: string;
  /** 집계 키 = `초성+중성+받침`. `groupBySyllable` 이 만드는 키와 같은 규칙. */
  statKey: string;
  syllable: string;
  unitId: string;
}

export interface KoreanPhonicsGrid {
  levelId: string;
  levelName: string;
  rows: string[];
  cols: string[];
  /** 표를 못 만드는 레벨(한글4)의 단일 축 — `cells` 가 빌 때만 쓴다. */
  vowels: string[];
  /** 토글 라벨용 — "자음×모음" / "받침×글자". */
  axisLabel: string;
  cells: KoreanPhonicsCell[];
}

const BASE_VOWELS = ['ㅏ', 'ㅑ', 'ㅓ', 'ㅕ', 'ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ', 'ㅣ'];

const empty = (levelId: string, levelName: string): KoreanPhonicsGrid => ({
  levelId,
  levelName,
  rows: [],
  cols: [],
  vowels: [],
  axisLabel: '자음×모음',
  cells: [],
});

/**
 * 레벨 하나를 표 한 장으로. **축은 레벨마다 다르다.**
 *
 * 🔴 받침 레벨(한글2)의 `blending` 은 `[초성, 중성, 받침, 결과음절]` **4원소**다. 3원소로 읽는 바람에
 *    받침(`ㅇ`)이 결과음절 자리에 들어갔고, 셀의 자음(`ㄱ`)이 행 헤더(`받침ㅇ`)와 안 맞아 **격자가 통째로
 *    비어 있었다**. 게다가 집계 키가 `ㄱㅏ` = 기본 음절 `가` 라, 화면의 「연습 중 35」는 받침 진도가
 *    아니라 **한글1 진도를 빌려온 숫자**였다 — 빈 칸보다 나쁜 거짓말이다.
 * 🔴 받침 레벨은 (초성 14 × 받침 7)로 98칸이 실제로 다 채워진다 — 활동이 `가`+`ㅇ`→`강` 을 그 단위로
 *    판정하므로 억지 표가 아니다(모음은 `ㅏ` 고정이라 축에서 뺀다). 표를 줄이는 건 한글4처럼 데이터가
 *    **없을 때** 하는 일이다.
 */
export function buildKoreanPhonicsGrid(levelId: string): KoreanPhonicsGrid {
  const level = KOREAN_PHONICS_CURRICULUM.find((l) => l.level === levelId);
  if (!level) return empty(levelId, levelId);

  const rows: string[] = [];
  const cols: string[] = [];
  const cells: KoreanPhonicsCell[] = [];
  const vowelOnly: string[] = [];
  let hasCoda = false;

  for (const u of level.units) {
    if (u.blending.length === 0) {
      vowelOnly.push(...u.phonemes);
      continue;
    }
    for (const b of u.blending) {
      const syllable = b[b.length - 1] ?? '';
      if (!isHangulSyllable(syllable)) continue;
      const { cho, jung, jong } = decomposeHangul(syllable);
      // 받침 글자면 행=받침·열=초성, 아니면 행=자음·열=모음.
      const row = jong ?? cho;
      const col = jong ? cho : jung;
      if (jong) hasCoda = true;
      if (!rows.includes(row)) rows.push(row);
      if (!cols.includes(col)) cols.push(col);
      cells.push({ row, col, statKey: `${cho}${jung}${jong ?? ''}`, syllable, unitId: u.id });
    }
  }

  return {
    levelId,
    levelName: level.name,
    rows,
    cols,
    // 한글4처럼 모음만 있는 레벨은 그 모음이 단일 축.
    vowels: vowelOnly.length > 0 && cells.length === 0 ? vowelOnly : BASE_VOWELS,
    axisLabel: hasCoda ? '받침×글자' : '자음×모음',
    cells,
  };
}

export const KOREAN_PHONICS_LEVELS = KOREAN_PHONICS_CURRICULUM.map((l) => ({
  id: l.level,
  name: l.name,
  description: l.description,
}));
