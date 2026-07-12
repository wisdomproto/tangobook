import { describe, it, expect } from 'vitest';
import { coverTitleFont } from '@tangobook/shared';

describe('coverTitleFont', () => {
  it('maps ko to Jua', () => {
    expect(coverTitleFont('ko').family).toBe('Jua');
  });
  it('maps latin languages (en/es/fr/de/ms/id/vi) to Baloo 2', () => {
    for (const l of ['en', 'es', 'fr', 'de', 'ms', 'id', 'vi'])
      expect(coverTitleFont(l).family).toBe('Baloo 2');
  });
  it('maps zh to ZCOOL KuaiLe, ja to Noto Sans JP, th to Noto Sans Thai', () => {
    expect(coverTitleFont('zh').family).toBe('ZCOOL KuaiLe');
    expect(coverTitleFont('ja').family).toBe('Noto Sans JP');
    expect(coverTitleFont('th').family).toBe('Noto Sans Thai');
  });
  it('falls back to Baloo 2 for unknown languages', () => {
    expect(coverTitleFont('xx').family).toBe('Baloo 2');
  });
});
