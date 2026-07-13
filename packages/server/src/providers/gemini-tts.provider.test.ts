import { describe, it, expect } from 'vitest';
import { resolveTtsLocale } from './gemini-tts.provider.js';

describe('resolveTtsLocale', () => {
  it('영어는 en-US 로 고정 (영국식/미국식 혼재 방지)', () => {
    expect(resolveTtsLocale('en')).toBe('en-US');
  });

  it('한국어는 ko-KR', () => {
    expect(resolveTtsLocale('ko')).toBe('ko-KR');
  });

  it('Gemini TTS 지원 언어 매핑', () => {
    expect(resolveTtsLocale('ja')).toBe('ja-JP');
    expect(resolveTtsLocale('vi')).toBe('vi-VN');
    expect(resolveTtsLocale('th')).toBe('th-TH');
  });

  it('Gemini TTS 미지원 언어(zh·ms)는 undefined (자동감지 유지)', () => {
    expect(resolveTtsLocale('zh')).toBeUndefined();
    expect(resolveTtsLocale('ms')).toBeUndefined();
  });

  it('language 미지정 시 undefined', () => {
    expect(resolveTtsLocale(undefined)).toBeUndefined();
    expect(resolveTtsLocale('')).toBeUndefined();
  });
});
