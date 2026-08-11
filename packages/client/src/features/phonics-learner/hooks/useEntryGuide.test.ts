import { describe, it, expect } from 'vitest';
import { ENTRY_GUIDE, voiceUrl, praiseLang } from './useEntryGuide';

// Vite 네이티브 — `public/` 의 실제 파일 목록(node:fs 불필요, 클라 tsconfig 에 node 타입 없음).
const VOICE_FILES = new Set(
  Object.keys(import.meta.glob('../../../../public/sounds/voice/*.mp3')).map((p) =>
    p.split('/').pop()
  )
);

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

  it('안내 10종 × en·vi·zh·th 는 그 언어 자산으로 (2026-08-11 일괄 생성)', () => {
    for (const name of Object.values(ENTRY_GUIDE)) {
      for (const lang of ['en', 'vi', 'zh', 'th']) {
        expect(voiceUrl(name, lang)).toBe(`/sounds/voice/${name}-${lang}.mp3`);
      }
    }
  });

  /**
   * 🔴 **목록에 적기만 하고 안 구우면 404 = 안내 통째 무음.** URL 만 재는 테스트는 그걸 못 잡으니
   *    파일이 실제로 있는지까지 본다(생성기 = `generate-activity-voice-prompts.mjs`).
   */
  it('`VOICE_LANGS` 가 내주는 URL 은 실제 mp3 가 있어야 한다', () => {
    for (const name of Object.values(ENTRY_GUIDE)) {
      for (const lang of ['ko', 'en', 'vi', 'zh', 'th']) {
        const file = voiceUrl(name, lang).split('/').pop()!;
        expect(VOICE_FILES.has(file), `없는 자산: ${file}`).toBe(true);
      }
    }
  });

  it('자산 없는 이름은 ko 폴백 — 무음 금지', () => {
    // paint-shape·line-match·block-make 는 ko 만 구워져 있다.
    expect(voiceUrl('paint-shape', 'vi')).toBe('/sounds/voice/paint-shape-ko.mp3');
    expect(voiceUrl('line-match', 'en')).toBe('/sounds/voice/line-match-ko.mp3');
  });

  it('모르는 언어는 ko 폴백', () => {
    expect(voiceUrl(ENTRY_GUIDE.quiz, 'fr')).toBe('/sounds/voice/quiz-start-ko.mp3');
  });

  it('ko 는 언제나 자기 자산', () => {
    expect(voiceUrl(ENTRY_GUIDE.write, 'ko')).toBe('/sounds/voice/write-start-ko.mp3');
  });

  it('지역 태그(en-US)도 언어로 자른다', () => {
    expect(voiceUrl(ENTRY_GUIDE.quiz, 'en-US')).toBe('/sounds/voice/quiz-start-en.mp3');
  });
});

/**
 * 🔴 칭찬("잘했어!")은 **UI 언어**다 — 콘텐츠 언어가 아니다.
 *    예전엔 파닉스가 `'ko'`(한글 단원)·`'en'`(영어 단원)을 넘겨서, 베트남 아이가 한글을 배우면
 *    한국어 칭찬을 들었다. 자산은 이미 5개 언어가 다 있다(ko 10 · en 6 · vi·zh·th 각 5).
 */
describe('praiseLang', () => {
  it('UI 언어를 그대로 — 지역 태그는 자른다', () => {
    expect(praiseLang('vi')).toBe('vi');
    expect(praiseLang('zh')).toBe('zh');
    expect(praiseLang('th')).toBe('th');
    expect(praiseLang('en-US')).toBe('en');
  });

  it('모르는 언어는 ko 폴백', () => {
    expect(praiseLang('fr')).toBe('ko');
  });
});
