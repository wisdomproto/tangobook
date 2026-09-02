import { describe, it, expect } from 'vitest';
import { parseBoard, composeHangul, type PlacedItem } from './compose';

/** 자음 블록 3×3 */
const C = (ch: string, x: number, y: number, w = 3): PlacedItem => ({ ch, x, y, w, h: 3 });
/** 세로형 모음 (ㅏㅓㅑㅕㅣ) — 2×5, ㅣ 는 1×5 */
const V = (ch: string, x: number, y: number, w = 2): PlacedItem => ({ ch, x, y, w, h: 5 });
/** 가로형 모음 (ㅗㅜㅛㅠㅡ) — 5×2, ㅡ 는 5×1 */
const H = (ch: string, x: number, y: number, h = 2): PlacedItem => ({ ch, x, y, w: 5, h });

describe('composeHangul', () => {
  it('초성·중성·받침을 한 글자로 합친다', () => {
    expect(composeHangul('ㄱ', 'ㅏ')).toBe('가');
    expect(composeHangul('ㄱ', 'ㅏ', 'ㅇ')).toBe('강');
    expect(composeHangul('ㅎ', 'ㅢ')).toBe('희');
  });

  it('없는 조합이면 null', () => {
    expect(composeHangul('ㅏ', 'ㅏ')).toBeNull();
    expect(composeHangul('ㄱ', 'ㄱ')).toBeNull();
  });
});

describe('parseBoard — 놓인 자리로 읽는다', () => {
  it('자음 오른쪽의 세로 모음 = 가로 조합', () => {
    expect(parseBoard([C('ㄱ', 0, 0), V('ㅏ', 3, 0)])).toEqual(['가']);
  });

  it('자음 아래의 가로 모음 = 세로 조합', () => {
    expect(parseBoard([C('ㄱ', 0, 0), H('ㅜ', 0, 3)])).toEqual(['구']);
  });

  it('그 아래 자음 = 받침', () => {
    expect(parseBoard([C('ㄱ', 0, 0), V('ㅏ', 3, 0), C('ㅇ', 0, 5)])).toEqual(['강']);
    expect(parseBoard([C('ㄱ', 0, 0), H('ㅜ', 0, 3), C('ㄱ', 0, 6)])).toEqual(['국']);
  });

  it('🔴 같은 자음 둘을 나란히 = 쌍자음 (쌍자음 블록이 없다)', () => {
    expect(parseBoard([C('ㄱ', 0, 0), C('ㄱ', 3, 0), V('ㅏ', 6, 0)])).toEqual(['까']);
  });

  it('🔴 모음 오른쪽에 ㅣ 하나 더 = ㅐㅔㅒㅖ (ㅐ 블록이 없다)', () => {
    expect(parseBoard([C('ㄱ', 0, 0), V('ㅏ', 3, 0), V('ㅣ', 5, 0, 1)])).toEqual(['개']);
    expect(parseBoard([C('ㄱ', 0, 0), V('ㅓ', 3, 0), V('ㅣ', 5, 0, 1)])).toEqual(['게']);
  });

  it('🔴 가로 모음 + 오른쪽 세로 모음 = 복합 모음', () => {
    expect(parseBoard([C('ㄱ', 0, 0), H('ㅗ', 0, 3), V('ㅏ', 5, 0)])).toEqual(['과']);
    expect(parseBoard([C('ㅇ', 0, 0), H('ㅡ', 0, 3, 1), V('ㅣ', 5, 0, 1)])).toEqual(['의']);
  });

  it('🔴 받침 오른쪽 자음이 자기 모음을 가졌으면 겹받침이 아니라 다음 초성이다', () => {
    // 갈비 — ㄹ 오른쪽의 ㅂ 은 ㅣ 를 데리고 있으므로 ㄼ 이 아니다
    const 갈비: PlacedItem[] = [
      C('ㄱ', 0, 0),
      V('ㅏ', 3, 0),
      C('ㄹ', 0, 5),
      C('ㅂ', 6, 0),
      V('ㅣ', 9, 0, 1),
    ];
    expect(parseBoard(갈비)).toEqual(['갈', '비']);
  });

  it('겹받침도 만들 수 있다', () => {
    // 값 — 받침 ㅂ 오른쪽 ㅅ, 그 ㅅ 은 모음이 없다
    expect(parseBoard([C('ㄱ', 0, 0), V('ㅏ', 3, 0), C('ㅂ', 0, 5), C('ㅅ', 3, 5)])).toEqual([
      '값',
    ]);
  });

  it('여러 음절은 왼쪽부터 읽는다', () => {
    const 나무: PlacedItem[] = [C('ㄴ', 0, 0), V('ㅏ', 3, 0), C('ㅁ', 6, 0), H('ㅜ', 6, 3)];
    expect(parseBoard(나무)).toEqual(['나', '무']);
  });

  it('짝을 못 찾은 블록은 그냥 빠진다 — 틀렸다고 하지 않는다', () => {
    expect(parseBoard([C('ㄱ', 0, 0)])).toEqual([]);
    expect(parseBoard([V('ㅏ', 0, 0)])).toEqual([]);
    expect(parseBoard([])).toEqual([]);
  });

  it('🔴 높이가 달라 살짝 어긋나게 놓아도 붙는다 (자음 3칸 + 모음 5칸)', () => {
    // 아이가 ㄱ 을 한 칸 내려 놓아도 「가」로 읽혀야 한다
    expect(parseBoard([C('ㄱ', 0, 1), V('ㅏ', 3, 0)])).toEqual(['가']);
  });
});
