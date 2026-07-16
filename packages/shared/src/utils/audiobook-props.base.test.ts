import { describe, it, expect } from 'vitest';
import { buildBaseAudiobookRenderData } from './audiobook-props';
import type { Storybook } from '../types/storybook';

// 자연관찰(실사) 책: 그림체(styleAssets.pageIllustrations)가 없고 이미지는 base pages[].illustrationUrl 에 있음.
const book = {
  id: 'n1',
  title: '캥거루',
  coverImage: 'https://x/ko-cover.webp',
  languages: ['ko', 'en'],
  primaryCoverByLang: { en: 'https://x/en-cover.webp' },
  pages: [
    {
      pageNumber: 1,
      text: '한글1',
      ttsUrl: 'https://x/ko1.mp3',
      illustrationUrl: 'https://x/photo1.webp',
      translations: { en: { text: 'EN1', ttsUrl: 'https://x/en1.mp3' } },
    },
    {
      pageNumber: 2,
      text: '한글2',
      ttsUrl: 'https://x/ko2.mp3',
      illustrationUrl: 'https://x/photo2.webp',
      translations: { en: { text: 'EN2', ttsUrl: 'https://x/en2.mp3' } },
    },
  ],
  // 실사 책의 styleAssets 는 pageIllustrations 가 비어 있어 styled 빌더로는 0슬라이드가 된다.
  styleAssets: { photographic: { pageIllustrations: {}, primaryCoverByLang: {} } },
} as unknown as Storybook;

describe('buildBaseAudiobookRenderData', () => {
  it('base pages[].illustrationUrl 을 슬라이드 이미지로 사용, ko 텍스트/tts', () => {
    const d = buildBaseAudiobookRenderData(book, { language: 'ko' });
    expect(d.slides.map((s) => s.imageUrl)).toEqual([
      'https://x/photo1.webp',
      'https://x/photo2.webp',
    ]);
    expect(d.slides[0].subtitleText).toBe('한글1');
    expect(d.slides[0].ttsUrl).toBe('https://x/ko1.mp3');
    expect(d.aspectRatio).toBe('16:9');
    expect(d.fps).toBe(30);
    expect(d.cover?.imageUrl).toBe('https://x/ko-cover.webp');
  });

  it('언어축=translations, 표지=primaryCoverByLang[lang]', () => {
    const d = buildBaseAudiobookRenderData(book, { language: 'en' });
    expect(d.slides[0].subtitleText).toBe('EN1');
    expect(d.slides[0].ttsUrl).toBe('https://x/en1.mp3');
    // 이미지는 실사 단일본이라 언어와 무관하게 동일.
    expect(d.slides[0].imageUrl).toBe('https://x/photo1.webp');
    expect(d.cover?.imageUrl).toBe('https://x/en-cover.webp');
  });

  it('illustrationUrl 없는 페이지는 스킵', () => {
    const partial = JSON.parse(JSON.stringify(book));
    delete partial.pages[1].illustrationUrl;
    const d = buildBaseAudiobookRenderData(partial, { language: 'ko' });
    expect(d.slides).toHaveLength(1);
    expect(d.slides[0].imageUrl).toBe('https://x/photo1.webp');
  });
});
