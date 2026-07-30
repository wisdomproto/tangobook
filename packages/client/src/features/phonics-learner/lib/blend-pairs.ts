import { composeHangul, isVerticalVowel } from '@tangobook/shared';

/**
 * 이 짝은 위·아래로 모이는가? 수직 모음(ㅗㅛㅜㅠㅡ)이면 세로.
 * 목록은 `@tangobook/shared` 의 `VERTICAL_VOWELS` 한 곳 — 블록 게임 튜토리얼과 같은 값을 본다.
 */
export function stacksVertically(pair: Pick<BlendPair, 'second'> | undefined): boolean {
  return isVerticalVowel(pair?.second);
}

/** 합쳐서 음절 하나를 만드는 두 글자. */
export interface BlendPair {
  first: string; // ㄱ (자음 모드) · 가 (받침 모드)
  second: string; // ㅏ (자음 모드) · ㅇ (받침 모드)
  /**
   * 둘째 글자를 **읽을 때** 쓰는 텍스트. 화면 글자와 다를 수 있다.
   *
   * 🔴 받침은 글자 그대로는 소리가 없다 — `ㅇ` 을 그냥 읽히면 음원이 없어 **무음**이다.
   *    자음에 ㅡ 를 붙인 형태(ㅇ→으, ㄱ→그, ㄴ→느)로 읽어야 소리가 난다.
   *    자음 모드의 모음(ㅏ)은 그대로 소리가 나므로 `second` 와 같다.
   */
  secondSound: string;
  syllable: string; // 가 · 강
}

export interface BlendSource {
  /** 자음 모드 — 학습 자음 (예: 'ㄱ'). */
  consonant?: string;
  /** 자음 모드 — 붙일 모음들. */
  blendVowels?: ReadonlyArray<string>;
  /** 받침 모드 — 학습 받침 (예: 'ㅇ'). */
  coda?: string;
  /** 받침 모드 — 받침을 붙일 음절의 초성 (중성은 ㅏ 고정). */
  codaOnsets?: ReadonlyArray<string>;
  /** 모음 모드 — 학습 모음 (예: 'ㅐ'). 자음 단원과 방향만 반대(모음 고정 · 자음 순회). */
  vowel?: string;
  /** 모음 모드 — 앞에 붙일 자음들 (ㄱ~ㅎ). */
  blendConsonants?: ReadonlyArray<string>;
}

/**
 * 음절 짝 만들기 — 자음 모드 `ㄱ + ㅏ → 가` / 받침 모드 `가 + ㅇ → 강`.
 *
 * 🔴 음절 만들기(탭)와 음절 써보기(쓰기) 두 활동이 **같은 짝**을 써야 한다. 각자 만들면
 * 한쪽만 고쳐지는 일이 생긴다 — 받침 모드의 중성 ㅏ 고정 같은 규칙이 특히 그렇다.
 */
export function buildBlendPairs({
  consonant,
  blendVowels,
  coda,
  codaOnsets,
  vowel,
  blendConsonants,
}: BlendSource): BlendPair[] {
  // 🔴 모음 모드 — 자음 단원과 pair 모양이 **완전히 같다**(first=자음·second=모음). 무엇을 고정하고
  //    무엇을 순회하는지만 다르므로 활동(듣기·쓰기)은 그대로 재사용한다.
  if (vowel) {
    return (blendConsonants ?? []).map((c) => ({
      first: c,
      second: vowel,
      secondSound: vowel,
      syllable: composeHangul(c, vowel, null) || `${c}${vowel}`,
    }));
  }
  if (coda) {
    const codaSound = composeHangul(coda, 'ㅡ', null) || coda; // ㅇ→으 · ㄱ→그 · ㄴ→느
    return (codaOnsets ?? []).map((onset) => {
      const base = composeHangul(onset, 'ㅏ', null) || `${onset}ㅏ`;
      return {
        first: base,
        second: coda,
        secondSound: codaSound,
        syllable: composeHangul(onset, 'ㅏ', coda) || `${base}${coda}`,
      };
    });
  }
  const c = consonant ?? '';
  return (blendVowels ?? []).map((v) => ({
    first: c,
    second: v,
    secondSound: v,
    syllable: composeHangul(c, v, null) || `${c}${v}`,
  }));
}

/** 배열에서 무작위 n 개 (원본 순서 유지 안 함). */
export function pickRandom<T>(items: readonly T[], n: number): T[] {
  const pool = [...items];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}
