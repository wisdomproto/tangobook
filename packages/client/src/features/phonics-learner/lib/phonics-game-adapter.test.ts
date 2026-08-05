import { describe, expect, it } from 'vitest';
import type { Storybook } from '@tangobook/shared';
import { findImageData } from './phonics-game-adapter';

/**
 * 🔴 회귀 가드 — wordFamilies 블렌드 음원("가 가 고기"·"a a apple")은 **영어 파닉스에서만** 낱말의
 *    대표음이다(2026-08-02 "B1 통일" 변경). 한글 단원도 wordFamilies ttsUrl 을 갖는데(자음 익히기용
 *    이어읽기), 그게 낱말 연습·게임의 낱말 소리를 덮어써 "고기" 를 눌렀더니 "가 가 고기" 로 읽혔다.
 */
function makeSb(id: string, wfTts: string): Storybook {
  return {
    id,
    flashcards: [{ word: '고기', ttsUrl: '' }],
    phonicsLesson: { wordFamilies: [{ words: [{ word: '고기', ttsUrl: wfTts }] }] },
  } as unknown as Storybook;
}

describe('findImageData — wordFamilies 블렌드 우선은 영어에만', () => {
  it('한글 단원(kr-*)은 wordFamilies 블렌드를 무시한다 (평범한 낱말 소리로 폴백)', () => {
    const blend = 'https://r2/kr-h1-u02-wf-0-0.mp3';
    const sb = makeSb('kr-h1-u02', blend);
    // 🔴 flashcard ttsUrl 이 빈 문자열이라 폴백값도 falsy — 호출부(`c.ttsUrl ? ...`)가 그걸 걸러
    //    resolveTtsUrl("고기") 평범한 낱말로 간다. 핵심은 **블렌드가 새지 않는 것**이다.
    const { ttsUrl } = findImageData(sb, '고기');
    expect(ttsUrl).toBeFalsy();
    expect(ttsUrl).not.toBe(blend);
  });

  it('영어 파닉스(en-*)는 wordFamilies 블렌드를 낱말 소리로 쓴다', () => {
    const sb = makeSb('en-b1-u01', 'https://r2/en-b1-u01-wf-0-0.mp3');
    expect(findImageData(sb, '고기').ttsUrl).toBe('https://r2/en-b1-u01-wf-0-0.mp3');
  });
});
