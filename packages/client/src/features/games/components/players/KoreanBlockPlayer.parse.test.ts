import { describe, it, expect } from 'vitest';
import { parseSpatialKorean } from './KoreanBlockPlayer';

/** 3×6 그리드 헬퍼 — 각 행의 앞쪽 셀만 지정, 나머지는 null. */
function grid(rows: (string | null)[][]): (string | null)[][] {
  return rows.map((r) => {
    const row = new Array<string | null>(6).fill(null);
    r.forEach((v, i) => (row[i] = v ?? null));
    return row;
  });
}

describe('parseSpatialKorean — 읽기 순서(열 우선)', () => {
  it('거울 — 거(가운데 줄) + 울(세로 ㅇㅜㄹ, ㅇ이 윗줄)을 열 순서로 읽어 "거울"', () => {
    // 사용자 리포트(2026-07-10): 행 순서로 읽으면 울(row0)→거(row1) = "울거" 오답이던 케이스.
    const g = grid([
      [null, null, null, null, 'ㅇ', null],
      ['ㄱ', 'ㅓ', null, null, 'ㅜ', null],
      [null, null, null, null, 'ㄹ', null],
    ]);
    expect(parseSpatialKorean(g).join('')).toBe('거울');
  });

  it('가나 — 같은 줄 좌우 배치', () => {
    const g = grid([['ㄱ', 'ㅏ', null, 'ㄴ', 'ㅏ', null], [], []]);
    expect(parseSpatialKorean(g).join('')).toBe('가나');
  });

  it('국 — 수직모음+받침 단일 음절(3행 세로)', () => {
    const g = grid([['ㄱ'], ['ㅜ'], ['ㄱ']]);
    expect(parseSpatialKorean(g).join('')).toBe('국');
  });

  it('바다 — 수평모음 두 음절', () => {
    const g = grid([['ㅂ', 'ㅏ', null, 'ㄷ', 'ㅏ', null], [], []]);
    expect(parseSpatialKorean(g).join('')).toBe('바다');
  });
});
