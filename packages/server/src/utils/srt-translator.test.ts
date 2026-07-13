import { describe, it, expect } from 'vitest';
import { LANGUAGE_NAMES } from './srt-translator';

describe('LANGUAGE_NAMES', () => {
  it('vi/th 포함 (다국어 자막 대상)', () => {
    expect(LANGUAGE_NAMES.vi).toBe('Vietnamese');
    expect(LANGUAGE_NAMES.th).toBe('Thai');
  });

  it('기존 ko/en/zh 보존', () => {
    expect(LANGUAGE_NAMES.ko).toBe('Korean');
    expect(LANGUAGE_NAMES.en).toBe('English');
    expect(LANGUAGE_NAMES.zh).toBe('Chinese');
  });
});
