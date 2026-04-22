import { describe, it, expect } from 'vitest';
import type { Page } from '@tangobook/shared';
import { getPageText, getPageTtsUrl } from './page-text';

const page: Page = {
  pageNumber: 1,
  text: '안녕',
  scene_description: '',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  scene_structure: {} as any,
  ttsUrl: '/ko.mp3',
  translations: { en: { text: 'Hi', ttsUrl: '/en.mp3' } },
};

describe('getPageText', () => {
  it('returns base text for ko', () => {
    expect(getPageText(page, 'ko')).toBe('안녕');
  });
  it('returns translation for en', () => {
    expect(getPageText(page, 'en')).toBe('Hi');
  });
  it('falls back to base text for missing lang', () => {
    expect(getPageText(page, 'ja')).toBe('안녕');
  });
});

describe('getPageTtsUrl', () => {
  it('returns ttsUrl for ko', () => {
    expect(getPageTtsUrl(page, 'ko')).toBe('/ko.mp3');
  });
  it('returns translation ttsUrl for en', () => {
    expect(getPageTtsUrl(page, 'en')).toBe('/en.mp3');
  });
  it('falls back to base ttsUrl for missing lang', () => {
    expect(getPageTtsUrl(page, 'ja')).toBe('/ko.mp3');
  });
});
