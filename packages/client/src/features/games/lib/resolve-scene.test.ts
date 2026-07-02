import { describe, it, expect } from 'vitest';
import type { Storybook } from '@tangobook/shared';
import { resolveSceneFromWord, findValidatedPageNumber } from './resolve-scene';

const book = {
  id: 'b1',
  pages: [
    { pageNumber: 1, text: '해가 뜬 첫 장면', illustrationUrl: 'p1.webp', ttsUrl: 'p1-ko.mp3' },
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
    // pages[] drift 사례 — claimed 는 2페이지지만 실제 등장은 1페이지
    { name: 'scene', korean: '장면', nameEn: 'scene', pages: [2] },
    // 본문 미등장 단어
    { name: 'butterfly', korean: '나비', nameEn: 'butterfly', pages: [1] },
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
    expect(s?.pageText).toBe('해가 뜬 첫 장면'); // en 번역 없음 → base text
    expect(s?.pageTtsUrl).toBeUndefined(); // en ttsUrl 없음 → 무음
  });

  it('pages[] drift — claimed 페이지에 단어 없으면 실제 등장 페이지로 대체', () => {
    const s = resolveSceneFromWord('장면', 'ko', book); // claimed [2] → 실제 1페이지
    expect(s?.pageNumber).toBe(1);
    expect(s?.illustrationUrl).toBe('p1.webp');
  });

  it('본문 어디에도 없는 단어는 null (엉뚱한 장면 방지)', () => {
    expect(resolveSceneFromWord('나비', 'ko', book)).toBeNull();
  });
});

describe('findValidatedPageNumber', () => {
  it('claimed 가 본문과 일치하면 그대로', () => {
    expect(findValidatedPageNumber('꽃', book, [2])).toBe(2);
  });

  it('claimed 여러 개 중 첫 일치 페이지', () => {
    expect(findValidatedPageNumber('꽃', book, [1, 2])).toBe(2);
  });

  it('koreanWord 없으면 검증 불가 — claimed[0] 신뢰', () => {
    expect(findValidatedPageNumber(undefined, book, [2])).toBe(2);
  });

  it('텍스트 없는 책은 검증 불가 — claimed[0] 신뢰', () => {
    const noText = {
      pages: [{ pageNumber: 1, illustrationUrl: 'x.webp' }],
    } as unknown as Storybook;
    expect(findValidatedPageNumber('꽃', noText, [1])).toBe(1);
  });

  it('claimed 비어있어도 전체 스캔으로 찾음', () => {
    expect(findValidatedPageNumber('해', book, [])).toBe(1);
  });
});
