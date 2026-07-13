import { describe, it, expect } from 'vitest';
import { buildStyledAudiobookRenderData } from './audiobook-props';
import type { Storybook } from '../types/storybook';

const book = {
  id: 'b1',
  title: '개구리 왕자',
  coverImage: 'https://x/base-cover.webp',
  languages: ['ko', 'en'],
  pages: [
    {
      pageNumber: 1,
      text: '한글1',
      ttsUrl: 'https://x/ko1.mp3',
      illustrationUrl: 'https://x/active1.webp',
      translations: { en: { text: 'EN1', ttsUrl: 'https://x/en1.mp3' } },
    },
    {
      pageNumber: 2,
      text: '한글2',
      ttsUrl: 'https://x/ko2.mp3',
      illustrationUrl: 'https://x/active2.webp',
      translations: { en: { text: 'EN2', ttsUrl: 'https://x/en2.mp3' } },
    },
  ],
  styleAssets: {
    'paper-craft': {
      coverImage: 'https://x/pc-cover.webp',
      primaryCoverByLang: { en: 'https://x/pc-en-cover.webp' },
      pageIllustrations: {
        '1': { illustrationUrl: 'https://x/pc1.webp', illustrationHistory: [] },
        '2': { illustrationUrl: 'https://x/pc2.webp', illustrationHistory: [] },
      },
    },
  },
} as unknown as Storybook;

describe('buildStyledAudiobookRenderData', () => {
  it('그림체축=이미지, ko는 base 텍스트/tts', () => {
    const d = buildStyledAudiobookRenderData(book, { artStyle: 'paper-craft', language: 'ko' });
    expect(d.slides.map((s) => s.imageUrl)).toEqual(['https://x/pc1.webp', 'https://x/pc2.webp']);
    expect(d.slides[0].subtitleText).toBe('한글1');
    expect(d.slides[0].ttsUrl).toBe('https://x/ko1.mp3');
    expect(d.aspectRatio).toBe('16:9');
    expect(d.fps).toBe(30);
  });

  it('언어축=translations, 표지=primaryCoverByLang', () => {
    const d = buildStyledAudiobookRenderData(book, { artStyle: 'paper-craft', language: 'en' });
    expect(d.slides[0].subtitleText).toBe('EN1');
    expect(d.slides[0].ttsUrl).toBe('https://x/en1.mp3');
    expect(d.cover?.imageUrl).toBe('https://x/pc-en-cover.webp');
  });

  it('표지 폴백: primaryCoverByLang 없으면 styleAssets.coverImage', () => {
    const d = buildStyledAudiobookRenderData(book, { artStyle: 'paper-craft', language: 'ko' });
    expect(d.cover?.imageUrl).toBe('https://x/pc-cover.webp');
  });

  it('그림체에 페이지 이미지 결측 시 그 페이지 스킵', () => {
    const partial = JSON.parse(JSON.stringify(book));
    delete partial.styleAssets['paper-craft'].pageIllustrations['2'];
    const d = buildStyledAudiobookRenderData(partial, { artStyle: 'paper-craft', language: 'ko' });
    expect(d.slides).toHaveLength(1);
    expect(d.slides[0].imageUrl).toBe('https://x/pc1.webp');
  });

  it('그림체 전체 결측 시 빈 slides (throw 아님 — 호출부가 처리)', () => {
    const d = buildStyledAudiobookRenderData(book, { artStyle: 'nonexistent', language: 'ko' });
    expect(d.slides).toHaveLength(0);
  });
});
