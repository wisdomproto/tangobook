import { describe, it, expect } from 'vitest';
import type { Storybook } from '@tangobook/shared';
import { resolveSceneFromWord } from './resolve-scene';

const book = {
  id: 'b1',
  pages: [
    { pageNumber: 1, text: '첫 장면', illustrationUrl: 'p1.webp', ttsUrl: 'p1-ko.mp3' },
    {
      pageNumber: 2,
      text: '꽃이 피었어요',
      illustrationUrl: 'p2.webp',
      ttsUrl: 'p2-ko.mp3',
      translations: { en: { text: 'A flower bloomed', ttsUrl: 'p2-en.mp3' } },
    },
  ],
  key_objects: [
    { name: 'flower', korean: '꽃', nameEn: 'flower', pages: [2] },
    { name: 'sun', korean: '해', nameEn: 'sun', pages: [1] },
  ],
} as unknown as Storybook;

describe('resolveSceneFromWord', () => {
  it('한글 단어 → 그 단어 첫 등장 페이지의 장면+한글 나레이션', () => {
    const s = resolveSceneFromWord('꽃', 'ko', book);
    expect(s).toEqual({
      illustrationUrl: 'p2.webp',
      pageNumber: 2,
      pageText: '꽃이 피었어요',
      pageTtsUrl: 'p2-ko.mp3',
    });
  });

  it('영어 단어(대소문자 무시) → 영어 번역 텍스트+나레이션', () => {
    const s = resolveSceneFromWord('Flower', 'en', book);
    expect(s).toEqual({
      illustrationUrl: 'p2.webp',
      pageNumber: 2,
      pageText: 'A flower bloomed',
      pageTtsUrl: 'p2-en.mp3',
    });
  });

  it('매칭 KeyObject 없으면 null (graceful)', () => {
    expect(resolveSceneFromWord('없는단어', 'ko', book)).toBeNull();
  });

  it('소스 동화책 없으면 null (사이드바 랜덤 게임 등)', () => {
    expect(resolveSceneFromWord('꽃', 'ko', undefined)).toBeNull();
  });

  it('영어 페이지 번역 없으면 base 텍스트 폴백 + ttsUrl 무음(undefined)', () => {
    const s = resolveSceneFromWord('sun', 'en', book);
    expect(s?.illustrationUrl).toBe('p1.webp');
    expect(s?.pageText).toBe('첫 장면'); // en 번역 없음 → base text
    expect(s?.pageTtsUrl).toBeUndefined(); // en ttsUrl 없음 → 무음
  });
});
