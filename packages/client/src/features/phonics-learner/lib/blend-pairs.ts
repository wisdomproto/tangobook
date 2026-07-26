import { composeHangul } from '@tangobook/shared';

/** 합쳐서 음절 하나를 만드는 두 글자. */
export interface BlendPair {
  first: string; // ㄱ (자음 모드) · 가 (받침 모드)
  second: string; // ㅏ (자음 모드) · ㅇ (받침 모드)
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
}: BlendSource): BlendPair[] {
  if (coda) {
    return (codaOnsets ?? []).map((onset) => {
      const base = composeHangul(onset, 'ㅏ', null) || `${onset}ㅏ`;
      return {
        first: base,
        second: coda,
        syllable: composeHangul(onset, 'ㅏ', coda) || `${base}${coda}`,
      };
    });
  }
  const c = consonant ?? '';
  return (blendVowels ?? []).map((v) => ({
    first: c,
    second: v,
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
