/**
 * 헷갈리는 글자 짝 — 「글자 사냥」의 방해꾼을 고르는 데 쓴다.
 *
 * 🔴 방해꾼이 아무 글자면 사냥이 **찾기**가 아니라 **훑기**가 된다. ㄱ 을 찾는 판에 ㅅ·ㅎ 만 깔리면
 *    모양을 볼 필요가 없다. 실제로 아이가 틀리는 짝(ㄱ/ㅋ, ㅁ/ㅂ, b/d/p)을 섞어야 변별이 과제가 된다.
 *
 * 목록 출처 = 유아 한글·파닉스 교재가 공통으로 짚는 혼동쌍(획 하나 차이·좌우 대칭·회전).
 */
const KOREAN_LOOKALIKES: Record<string, string[]> = {
  // 자음 — 획 하나 차이거나 방향만 다른 것
  ㄱ: ['ㅋ', 'ㄲ', 'ㄴ', 'ㅅ'],
  ㄴ: ['ㄱ', 'ㄷ', 'ㄹ'],
  ㄷ: ['ㄴ', 'ㄹ', 'ㅌ', 'ㄸ'],
  ㄹ: ['ㄷ', 'ㄴ', 'ㅌ'],
  ㅁ: ['ㅂ', 'ㅇ', 'ㅍ'],
  ㅂ: ['ㅁ', 'ㅃ', 'ㅍ'],
  ㅅ: ['ㅈ', 'ㅆ', 'ㅊ', 'ㄱ'],
  ㅇ: ['ㅁ', 'ㅎ', 'ㅊ'],
  ㅈ: ['ㅅ', 'ㅊ', 'ㅉ', 'ㅁ'],
  ㅊ: ['ㅈ', 'ㅅ', 'ㅎ'],
  ㅋ: ['ㄱ', 'ㅌ', 'ㄲ'],
  ㅌ: ['ㄷ', 'ㅋ', 'ㅍ', 'ㄹ'],
  ㅍ: ['ㅂ', 'ㅁ', 'ㅌ'],
  ㅎ: ['ㅇ', 'ㅊ', 'ㅈ'],
  ㄲ: ['ㄱ', 'ㅋ'],
  ㄸ: ['ㄷ', 'ㅌ'],
  ㅃ: ['ㅂ', 'ㅁ'],
  ㅆ: ['ㅅ', 'ㅈ'],
  ㅉ: ['ㅈ', 'ㅅ'],
  // 모음 — 좌우·상하 대칭이 함정이다
  ㅏ: ['ㅓ', 'ㅑ', 'ㅐ'],
  ㅑ: ['ㅏ', 'ㅕ', 'ㅒ'],
  ㅓ: ['ㅏ', 'ㅕ', 'ㅔ'],
  ㅕ: ['ㅓ', 'ㅑ', 'ㅖ'],
  ㅗ: ['ㅜ', 'ㅛ', 'ㅡ'],
  ㅛ: ['ㅗ', 'ㅠ', 'ㅜ'],
  ㅜ: ['ㅗ', 'ㅠ', 'ㅡ'],
  ㅠ: ['ㅜ', 'ㅛ', 'ㅗ'],
  ㅡ: ['ㅣ', 'ㅗ', 'ㅜ'],
  ㅣ: ['ㅡ', 'ㅏ', 'ㅓ'],
  ㅐ: ['ㅔ', 'ㅒ', 'ㅏ'],
  ㅔ: ['ㅐ', 'ㅖ', 'ㅓ'],
  ㅒ: ['ㅖ', 'ㅐ', 'ㅑ'],
  ㅖ: ['ㅒ', 'ㅔ', 'ㅕ'],
  ㅘ: ['ㅝ', 'ㅚ', 'ㅙ'],
  ㅙ: ['ㅞ', 'ㅘ', 'ㅚ'],
  ㅚ: ['ㅟ', 'ㅘ', 'ㅙ'],
  ㅝ: ['ㅘ', 'ㅟ', 'ㅞ'],
  ㅞ: ['ㅙ', 'ㅝ', 'ㅟ'],
  ㅟ: ['ㅚ', 'ㅝ', 'ㅢ'],
  ㅢ: ['ㅟ', 'ㅡ', 'ㅣ'],
};

const ENGLISH_LOOKALIKES: Record<string, string[]> = {
  b: ['d', 'p', 'q', 'h'],
  d: ['b', 'p', 'q', 'g'],
  p: ['q', 'b', 'd'],
  q: ['p', 'g', 'd'],
  g: ['q', 'y', 'j'],
  m: ['n', 'w', 'h'],
  n: ['m', 'u', 'h', 'r'],
  u: ['n', 'v', 'w'],
  v: ['w', 'u', 'y'],
  w: ['m', 'v', 'u'],
  a: ['e', 'o', 'c'],
  e: ['a', 'c', 'o'],
  o: ['c', 'e', 'a'],
  c: ['e', 'o', 'a'],
  i: ['j', 'l', 't'],
  j: ['i', 'g', 'y'],
  l: ['i', 't', 'f'],
  t: ['f', 'l', 'i'],
  f: ['t', 'l', 'i'],
  h: ['n', 'b', 'k'],
  k: ['h', 'x', 'y'],
  r: ['n', 'v', 'h'],
  s: ['z', 'c', 'e'],
  x: ['y', 'k', 'v'],
  y: ['v', 'g', 'x'],
  z: ['s', 'n', 'x'],
};

/** 영어 word family(at·an…) 방해꾼을 만들 때 갈아 끼우는 조각. */
const EN_VOWELS = ['a', 'e', 'i', 'o', 'u'];
const EN_ENDINGS = ['t', 'n', 'p', 'd', 'g', 'm', 'b', 'ck'];

/**
 * `letter` 와 헷갈리는 글자들. 사전에 없으면 모양이 아니라 **구성으로** 만든다:
 * 영어 word family(`at`)는 모음·끝소리를 갈아 끼운 것(`et`·`an`)이 곧 진짜 혼동 대상이다.
 */
export function lookalikesOf(letter: string): string[] {
  const direct = KOREAN_LOOKALIKES[letter] ?? ENGLISH_LOOKALIKES[letter.toLowerCase()];
  // 영어 복습 카드는 대문자('A')로 온다 — 판에 소문자만 깔리면 목표와 다른 글자로 보인다.
  if (direct) return /^[A-Z]$/.test(letter) ? direct.map((d) => d.toUpperCase()) : direct;

  // 영어 word family — 'at' → 'et','it','an','ap' …
  const m = letter.toLowerCase().match(/^([aeiou])(.+)$/);
  if (m) {
    const [, v, tail] = m;
    return [
      ...EN_VOWELS.filter((x) => x !== v).map((x) => x + tail),
      ...EN_ENDINGS.filter((x) => x !== tail).map((x) => v + x),
    ];
  }
  return [];
}

function shuffled<T>(arr: readonly T[], rand: () => number): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * 사냥 판 — 목표 글자 `targets` 개 + 방해꾼으로 `size` 칸을 채워 섞는다.
 *
 * 방해꾼 우선순위: 헷갈리는 짝 → 같은 복습 묶음의 다른 글자 → (모자라면) 앞의 것을 돌려 쓴다.
 * 🔴 `others`(같은 판의 다른 복습 글자)를 넣는 이유 — 지난 단원 글자가 섞여야 복습이 된다.
 */
export function buildHuntBoard(opts: {
  target: string;
  others?: readonly string[];
  size?: number;
  targets?: number;
  rand?: () => number;
}): string[] {
  const { target, others = [], size = 18, targets = 5, rand = Math.random } = opts;
  const need = Math.max(0, size - targets);
  const pool = [...new Set([...lookalikesOf(target), ...others])].filter((c) => c && c !== target);
  const fill: string[] = [];
  if (pool.length) {
    // 헷갈리는 짝부터 한 바퀴 다 쓰고, 모자라면 다시 돈다(같은 글자가 두 번 나와도 무방).
    while (fill.length < need) fill.push(...shuffled(pool, rand).slice(0, need - fill.length));
  } else {
    while (fill.length < need) fill.push('·');
  }
  return shuffled([...Array<string>(targets).fill(target), ...fill], rand);
}
