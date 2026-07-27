import { describe, it, expect } from 'vitest';
import { buildBlendPairs } from './blend-pairs';

describe('buildBlendPairs — 자음 모드', () => {
  it('ㄱ + 모음 → 음절, 모음은 그대로 읽는다', () => {
    const pairs = buildBlendPairs({ consonant: 'ㄱ', blendVowels: ['ㅏ', 'ㅑ'] });
    expect(pairs).toEqual([
      { first: 'ㄱ', second: 'ㅏ', secondSound: 'ㅏ', syllable: '가' },
      { first: 'ㄱ', second: 'ㅑ', secondSound: 'ㅑ', syllable: '갸' },
    ]);
  });
});

describe('buildBlendPairs — 받침 모드', () => {
  const pairs = buildBlendPairs({ coda: 'ㅇ', codaOnsets: ['ㄱ', 'ㄴ'] });

  it('[가] + [ㅇ] → [강] (중성은 ㅏ 고정)', () => {
    expect(pairs.map((p) => [p.first, p.second, p.syllable])).toEqual([
      ['가', 'ㅇ', '강'],
      ['나', 'ㅇ', '낭'],
    ]);
  });

  it('🔴 받침은 화면 글자와 읽는 소리가 다르다 — ㅇ 을 그대로 읽으면 음원이 없어 무음이다', () => {
    expect(pairs.every((p) => p.secondSound === '으')).toBe(true);
    expect(pairs.every((p) => p.second !== p.secondSound)).toBe(true);
  });

  it('받침마다 ㅡ 를 붙인 소리 — ㄱ→그 · ㄴ→느 · ㅁ→므', () => {
    const soundOf = (coda: string) => buildBlendPairs({ coda, codaOnsets: ['ㄱ'] })[0].secondSound;
    expect(soundOf('ㄱ')).toBe('그');
    expect(soundOf('ㄴ')).toBe('느');
    expect(soundOf('ㅁ')).toBe('므');
  });
});
