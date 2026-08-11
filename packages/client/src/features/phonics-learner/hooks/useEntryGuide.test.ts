import { describe, it, expect } from 'vitest';
import { ENTRY_GUIDE, voiceUrl } from './useEntryGuide';

/**
 * 🔴 안내 음성은 **UI 언어**를 탄다(배우는 내용의 언어가 아니라). 자산이 없는 언어는 **반드시**
 *    ko 로 떨어져야 한다 — 404 면 안내가 통째로 무음이고, 글 못 읽는 4~7세에겐 화면이 아무
 *    말도 안 하는 것과 같다.
 */
describe('voiceUrl', () => {
  it('그 언어 자산이 있으면 그 언어로', () => {
    // quiz-start-en.mp3 는 이미 구워져 있다(코드가 안 쓰고 있었을 뿐).
    expect(voiceUrl(ENTRY_GUIDE.quiz, 'en')).toBe('/sounds/voice/quiz-start-en.mp3');
  });

  it('자산 없는 언어는 ko 폴백 — 무음 금지', () => {
    expect(voiceUrl(ENTRY_GUIDE.quiz, 'vi')).toBe('/sounds/voice/quiz-start-ko.mp3');
    expect(voiceUrl(ENTRY_GUIDE.hunt, 'en')).toBe('/sounds/voice/hunt-start-ko.mp3');
  });

  it('ko 는 언제나 자기 자산', () => {
    expect(voiceUrl(ENTRY_GUIDE.write, 'ko')).toBe('/sounds/voice/write-start-ko.mp3');
  });

  it('지역 태그(en-US)도 언어로 자른다', () => {
    expect(voiceUrl(ENTRY_GUIDE.quiz, 'en-US')).toBe('/sounds/voice/quiz-start-en.mp3');
  });
});
