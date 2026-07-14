import { describe, it, expect } from 'vitest';
import { isSessionExpired, type NaverSession } from './naver-session.js';

const mk = (savedAtIso: string): NaverSession => ({
  savedAt: savedAtIso,
  cookies: [],
  localStorage: {},
});

describe('isSessionExpired', () => {
  it('24시간 이내면 유효', () => {
    const now = new Date('2026-07-13T12:00:00Z');
    expect(isSessionExpired(mk('2026-07-13T00:00:00Z'), now)).toBe(false);
  });
  it('24시간 초과면 만료', () => {
    const now = new Date('2026-07-14T13:00:00Z');
    expect(isSessionExpired(mk('2026-07-13T12:00:00Z'), now)).toBe(true);
  });
});
