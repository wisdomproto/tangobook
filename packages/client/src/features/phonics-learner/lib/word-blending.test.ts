import { describe, expect, it } from 'vitest';
import { englishWordBlendSteps, koreanWordBlendSteps } from './word-blending';

describe('meaningful word blending steps', () => {
  it('builds the rime before the onset, including a digraph onset', () => {
    expect(englishWordBlendSteps('cat', '_at')).toEqual([
      { parts: ['a', 't'], result: 'at' },
      { parts: ['c', 'at'], result: 'cat', wholeWord: true },
    ]);
    expect(englishWordBlendSteps('ship', 'sh_')).toEqual([
      { parts: ['i', 'p'], result: 'ip' },
      { parts: ['sh', 'ip'], result: 'ship', wholeWord: true },
    ]);
  });
  it('keeps vowel teams together, keeps qu as the onset, and never pronounces silent e', () => {
    expect(englishWordBlendSteps('feet', 'ee')[0].parts).toEqual(['ee', 't']);
    expect(englishWordBlendSteps('queen', 'ee').at(-1)?.parts).toEqual(['qu', 'een']);
    expect(englishWordBlendSteps('bake', '_ake')).toEqual([
      { parts: ['a', 'k'], result: 'ak' },
      { parts: ['ak', 'e'], result: 'ake', silentParts: [1] },
      { parts: ['b', 'ake'], result: 'bake', wholeWord: true },
    ]);
  });
  it('Book 1 illustrates the initial letter without requiring word decoding', () => {
    expect(englishWordBlendSteps('apple', undefined, true)).toEqual([
      { parts: ['a'], result: 'apple', wholeWord: true, wholeAudioOnly: true },
    ]);
  });
  it('does not pretend multisyllabic vocabulary or an exception word is a regular one-syllable rime', () => {
    expect(englishWordBlendSteps('elephant', 'ph_')).toEqual([
      { parts: ['elephant'], result: 'elephant', wholeWord: true, wholeAudioOnly: true },
    ]);
    expect(englishWordBlendSteps('glove', 'gl_')[0].wholeAudioOnly).toBe(true);
  });
  it('builds Hangul CV syllables, then coda, then the whole word', () => {
    expect(koreanWordBlendSteps('고기')).toEqual([
      { parts: ['ㄱ', 'ㅗ'], result: '고' },
      { parts: ['ㄱ', 'ㅣ'], result: '기' },
      { parts: ['고', '기'], result: '고기', wholeWord: true },
    ]);
    expect(koreanWordBlendSteps('강')).toEqual([
      { parts: ['ㄱ', 'ㅏ'], result: '가' },
      { parts: ['가', 'ㅇ'], result: '강', wholeWord: true },
    ]);
  });
});
