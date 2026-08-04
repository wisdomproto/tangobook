import { describe, it, expect } from 'vitest';
import { lookupEnglishSound } from './usePhonicsMap';

// 서버 downloadSound 와 같은 후보 순서를 지키는지 — 소리를 안 바꾸는 게 목적.
describe('lookupEnglishSound', () => {
  it('낱글자는 그대로 찾는다', () => {
    const m = new Map([['e', 'E.mp3']]);
    expect(lookupEnglishSound(m, 'e')).toBe('E.mp3');
  });

  it("'Aa' 는 소문자 → 같은 글자 압축으로 'a' 를 찾는다", () => {
    const m = new Map([['a', 'A.mp3']]);
    expect(lookupEnglishSound(m, 'Aa')).toBe('A.mp3');
  });

  it("하이픈은 떼고도 찾는다 ('yo-yo' → 'yoyo')", () => {
    const m = new Map([['yoyo', 'Y.mp3']]);
    expect(lookupEnglishSound(m, 'yo-yo')).toBe('Y.mp3');
  });

  it('없으면 undefined', () => {
    expect(lookupEnglishSound(new Map(), 'zzz')).toBeUndefined();
  });

  it('원본이 우선한다 (압축본보다)', () => {
    // 'aa' 자체가 있으면 그걸, 없을 때만 'a' 로 압축.
    const m = new Map([
      ['aa', 'AA.mp3'],
      ['a', 'A.mp3'],
    ]);
    expect(lookupEnglishSound(m, 'aa')).toBe('AA.mp3');
  });
});
