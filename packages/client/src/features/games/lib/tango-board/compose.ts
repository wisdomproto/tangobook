/**
 * 판 위에 놓인 블록들 → 한글 음절. `public/tango-board.html` 프로토타입에서 옮겨 왔다.
 *
 * 🔴 **슬롯이 없다.** 아이는 아무 데나 놓고, 무엇이 무엇의 초성·중성·받침인지는
 *    **놓인 자리로** 정한다 — 자음 오른쪽의 세로 모음 = 가로 조합(가),
 *    자음 아래의 가로 모음 = 세로 조합(구), 그 아래 자음 = 받침(강).
 *    실물 보드가 그렇게 동작하므로 앱도 같아야 한다.
 */

/** 판 위 블록 하나 — 좌상단 칸 좌표와 칸 단위 크기. */
export interface PlacedItem {
  ch: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

const CHO = [
  'ㄱ',
  'ㄲ',
  'ㄴ',
  'ㄷ',
  'ㄸ',
  'ㄹ',
  'ㅁ',
  'ㅂ',
  'ㅃ',
  'ㅅ',
  'ㅆ',
  'ㅇ',
  'ㅈ',
  'ㅉ',
  'ㅊ',
  'ㅋ',
  'ㅌ',
  'ㅍ',
  'ㅎ',
];
const JUNG = [
  'ㅏ',
  'ㅐ',
  'ㅑ',
  'ㅒ',
  'ㅓ',
  'ㅔ',
  'ㅕ',
  'ㅖ',
  'ㅗ',
  'ㅘ',
  'ㅙ',
  'ㅚ',
  'ㅛ',
  'ㅜ',
  'ㅝ',
  'ㅞ',
  'ㅟ',
  'ㅠ',
  'ㅡ',
  'ㅢ',
  'ㅣ',
];
const JONG = [
  '',
  'ㄱ',
  'ㄲ',
  'ㄳ',
  'ㄴ',
  'ㄵ',
  'ㄶ',
  'ㄷ',
  'ㄹ',
  'ㄺ',
  'ㄻ',
  'ㄼ',
  'ㄽ',
  'ㄾ',
  'ㄿ',
  'ㅀ',
  'ㅁ',
  'ㅂ',
  'ㅄ',
  'ㅅ',
  'ㅆ',
  'ㅇ',
  'ㅈ',
  'ㅊ',
  'ㅋ',
  'ㅌ',
  'ㅍ',
  'ㅎ',
];
const JUNG_SET = new Set(JUNG);

/** 가로 모음 + 그 오른쪽 세로 모음 = 복합 모음. */
const COMPOUND: Record<string, string> = {
  ㅗㅏ: 'ㅘ',
  ㅗㅐ: 'ㅙ',
  ㅗㅣ: 'ㅚ',
  ㅜㅓ: 'ㅝ',
  ㅜㅔ: 'ㅞ',
  ㅜㅣ: 'ㅟ',
  ㅡㅣ: 'ㅢ',
};
/** 모음 오른쪽에 ㅣ 하나 더 — ㅐㅔㅒㅖ 블록을 없앤 대신 조합으로 만든다. */
const PLUS_I: Record<string, string> = {
  ㅏ: 'ㅐ',
  ㅓ: 'ㅔ',
  ㅑ: 'ㅒ',
  ㅕ: 'ㅖ',
  ㅘ: 'ㅙ',
  ㅝ: 'ㅞ',
};
/** 같은 자음 둘이 나란히 = 쌍자음 (쌍자음 블록을 없앤 대신). */
const DOUBLE: Record<string, string> = { ㄱ: 'ㄲ', ㄷ: 'ㄸ', ㅂ: 'ㅃ', ㅅ: 'ㅆ', ㅈ: 'ㅉ' };
/** 겹받침 = 받침 오른쪽에 자음 하나 더. */
const DOUBLE_JONG: Record<string, string> = {
  ㄱㅅ: 'ㄳ',
  ㄴㅈ: 'ㄵ',
  ㄴㅎ: 'ㄶ',
  ㄹㄱ: 'ㄺ',
  ㄹㅁ: 'ㄻ',
  ㄹㅂ: 'ㄼ',
  ㄹㅅ: 'ㄽ',
  ㄹㅌ: 'ㄾ',
  ㄹㅍ: 'ㄿ',
  ㄹㅎ: 'ㅀ',
  ㅂㅅ: 'ㅄ',
};

export const isVowel = (ch: string): boolean => JUNG_SET.has(ch);

export function composeHangul(cho: string, jung: string, jong?: string | null): string | null {
  const ci = CHO.indexOf(cho);
  const ji = JUNG.indexOf(jung);
  const ki = jong ? JONG.indexOf(jong) : 0;
  if (ci < 0 || ji < 0 || ki < 0) return null;
  return String.fromCharCode(0xac00 + (ci * 21 + ji) * 28 + ki);
}

interface Node extends PlacedItem {
  cx: number;
  cy: number;
}

/** 같은 자음이 가로로 딱 붙어 있으면 쌍자음으로 합친다 (ㄱㄱ→ㄲ). 인접·같은 행만. */
function mergeDoubles(items: PlacedItem[]): PlacedItem[] {
  const out: (PlacedItem | null)[] = items.map((i) => ({ ...i }));
  for (let i = 0; i < out.length; i++) {
    const a = out[i];
    if (!a || isVowel(a.ch) || !DOUBLE[a.ch]) continue;
    for (let j = 0; j < out.length; j++) {
      const b = out[j];
      if (i === j || !b || b.ch !== a.ch) continue;
      if (Math.abs(b.x - (a.x + a.w)) <= 1 && Math.abs(b.y - a.y) <= 1) {
        a.ch = DOUBLE[a.ch];
        a.w = b.x + b.w - a.x; // 둘을 아우르는 폭 — 모음 위치 판정에 쓰인다
        out[j] = null;
        break;
      }
    }
  }
  return out.filter((x): x is PlacedItem => x !== null);
}

/**
 * 판 위 블록들을 읽어 음절 목록으로. 왼쪽 → 오른쪽 순.
 * 어디에도 못 붙는 블록은 그냥 빠진다 — 아직 만드는 중일 뿐이라 틀렸다고 말하지 않는다.
 */
export function parseBoard(rawItems: PlacedItem[]): string[] {
  const merged = mergeDoubles(rawItems);
  const items: Node[] = merged.map((it) => ({ ...it, cx: it.x + it.w / 2, cy: it.y + it.h / 2 }));
  const cons = items.filter((i) => !isVowel(i.ch)).sort((a, b) => a.cx - b.cx || a.cy - b.cy);
  const vows = items.filter((i) => isVowel(i.ch));
  const used = new Set<Node>();
  const out: { s: string; cx: number; cy: number }[] = [];

  const nearest = (list: Node[], score: (v: Node) => number | null): Node | null => {
    let best: Node | null = null;
    let bd = Infinity;
    for (const v of list) {
      if (used.has(v)) continue;
      const d = score(v);
      if (d != null && d < bd) {
        bd = d;
        best = v;
      }
    }
    return best;
  };

  /** 이 자음이 자기 모음을 데리고 있는가 = 받침이 아니라 다음 음절의 초성이다. */
  const hasOwnVowel = (c: Node): boolean =>
    vows.some((v) => {
      if (used.has(v)) return false;
      if (v.h > v.w) return v.cx - c.cx > 0 && v.cx - c.cx <= 7 && Math.abs(v.cy - c.cy) <= 2.5;
      return v.cy - c.cy > 0 && v.cy - c.cy <= 7 && Math.abs(v.cx - c.cx) <= 3.5;
    });

  for (const A of cons) {
    if (used.has(A)) continue;

    // 오른쪽의 세로형 모음 (ㅏㅓㅣ…) — 가로 조합.
    // 🔴 중심거리로 재면 ㄱ(3칸)+ㅏ(5칸)처럼 높이가 달라 살짝 내려 놓으면 끊긴다.
    //    「세로로 겹치나」로 판정한다 — 가 = 자음(위쪽) + 모음(전체 높이).
    const Vh = nearest(vows, (v) => {
      if (v.h <= v.w) return null;
      const dx = v.cx - A.cx;
      if (dx <= 0 || dx > 7) return null;
      const overlap = Math.min(A.y + A.h, v.y + v.h) - Math.max(A.y, v.y);
      if (overlap < -2) return null;
      return dx + Math.abs(v.cy - A.cy);
    });
    // 아래의 가로형 모음 (ㅗㅜㅡ…) — 세로 조합
    const Vv = nearest(vows, (v) => {
      if (v.w <= v.h) return null;
      const dy = v.cy - A.cy;
      const dx = Math.abs(v.cx - A.cx);
      if (dy <= 0 || dy > 7 || dx > 3.5) return null;
      return dy + dx;
    });

    let jung: string | null = null;
    let parts: Node[] = [];
    let vertical = false;
    if (Vv && Vh && Vh.cx > Vv.cx && COMPOUND[Vv.ch + Vh.ch]) {
      jung = COMPOUND[Vv.ch + Vh.ch];
      parts = [Vv, Vh];
      vertical = true;
    } else if (Vh) {
      jung = Vh.ch;
      parts = [Vh];
    } else if (Vv) {
      jung = Vv.ch;
      parts = [Vv];
      vertical = true;
    }
    if (!jung) continue;

    // 오른쪽 끝 모음 뒤에 ㅣ 하나 더 = ㅐㅔㅒㅖ·ㅙㅞ
    if (PLUS_I[jung]) {
      const right = parts[parts.length - 1];
      const Vi = nearest(vows, (v) => {
        if (parts.includes(v) || v.ch !== 'ㅣ') return null;
        const dx = v.cx - right.cx;
        const dy = Math.abs(v.cy - right.cy);
        if (dx <= 0 || dx > 5 || dy > 2.5) return null;
        return dx + dy;
      });
      if (Vi) {
        jung = PLUS_I[jung];
        parts.push(Vi);
      }
    }

    used.add(A);
    for (const v of parts) used.add(v);

    // 받침 — 초성(과 모음) 아래의 자음
    const floorY = vertical ? (Vv as Node).cy : A.cy;
    const xs = [A.cx, ...parts.map((v) => v.cx)];
    const loL = Math.min(...xs) - 2.5;
    const hiL = Math.max(...xs) + 2.5;
    const J = nearest(cons, (c) => {
      if (c === A) return null;
      const dy = c.cy - floorY;
      if (dy < 1.5 || dy > 7) return null;
      if (c.cx < loL || c.cx > hiL) return null;
      return dy + Math.abs(c.cx - A.cx);
    });
    let jongCh: string | null = null;
    let J2: Node | null = null;
    if (J) {
      used.add(J);
      jongCh = J.ch;
      // 겹받침 — 받침 오른쪽에 붙은 자음. 🔴 그 자음이 자기 모음을 데리고 있으면
      //   겹받침이 아니라 다음 음절의 초성이다(「갈비」를 「갋이」로 읽지 않게).
      J2 = nearest(cons, (c) => {
        if (c === A || c === J) return null;
        const dx = c.cx - J.cx;
        const dy = Math.abs(c.cy - J.cy);
        if (dx <= 0 || dx > 6 || dy > 2) return null;
        if (!DOUBLE_JONG[J.ch + c.ch]) return null;
        if (hasOwnVowel(c)) return null;
        return dx + dy;
      });
      if (J2) {
        used.add(J2);
        jongCh = DOUBLE_JONG[J.ch + J2.ch];
      }
    }

    const s = composeHangul(A.ch, jung, jongCh);
    if (s) {
      out.push({ s, cx: A.cx, cy: A.cy });
    } else {
      used.delete(A);
      for (const v of parts) used.delete(v);
      if (J) used.delete(J);
      if (J2) used.delete(J2);
    }
  }

  out.sort((a, b) => a.cx - b.cx || a.cy - b.cy);
  return out.map((x) => x.s);
}
