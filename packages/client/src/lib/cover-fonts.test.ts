import { describe, it, expect } from 'vitest';
import { coverTitleFont } from '@tangobook/shared';

describe('coverTitleFont', () => {
  it('uses the complete dedicated family for Korean', () => {
    expect(coverTitleFont('ko').family).toBe('TangoBook Story Hand Global');
  });
  it('uses the same dedicated family across registered Latin languages', () => {
    for (const l of ['en', 'es', 'fr', 'de', 'ms', 'id', 'vi'])
      expect(coverTitleFont(l).family).toBe('TangoBook Story Hand Global');
  });
  it('uses regional Japanese outlines and complete Chinese/Thai scopes', () => {
    expect(coverTitleFont('zh').family).toBe('TangoBook Story Hand Global');
    expect(coverTitleFont('ja').family).toBe('TangoBook Story Hand Global Japanese');
    expect(coverTitleFont('th').family).toBe('TangoBook Story Hand Global');
  });
  it('normalizes regional tags and keeps unknown languages in the complete family', () => {
    expect(coverTitleFont('xx').family).toBe('TangoBook Story Hand Global');
    expect(coverTitleFont('zh-CN').family).toBe(coverTitleFont('zh').family);
    expect(coverTitleFont('ja-JP').family).toBe(coverTitleFont('ja').family);
  });
});
