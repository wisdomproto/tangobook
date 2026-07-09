import { describe, it, expect } from 'vitest';
import { resolveGrantUpdate } from './members-grant.js';

const NOW = Date.parse('2026-07-09T00:00:00Z');
const existing = { trial_started_at: null, referral_bonus_days: 3, paid_until: null };

describe('resolveGrantUpdate', () => {
  it('trial-reset → trial_started_at = now', () => {
    expect(resolveGrantUpdate({ type: 'trial-reset' }, existing, NOW)).toEqual({
      trial_started_at: new Date(NOW).toISOString(),
    });
  });
  it('bonus-days → 기존값에 누적', () => {
    expect(resolveGrantUpdate({ type: 'bonus-days', days: 7 }, existing, NOW)).toEqual({
      referral_bonus_days: 10,
    });
  });
  it('bonus-days 범위 밖(0, 366, 1.5, NaN) → 400', () => {
    for (const days of [0, 366, 1.5, NaN]) {
      expect(() => resolveGrantUpdate({ type: 'bonus-days', days }, existing, NOW)).toThrowError(
        /1~365/
      );
    }
  });
  it('paid-until 미래 → paid_until 설정', () => {
    expect(
      resolveGrantUpdate({ type: 'paid-until', until: '2026-12-31T00:00:00Z' }, existing, NOW)
    ).toEqual({ paid_until: '2026-12-31T00:00:00.000Z' });
  });
  it('paid-until 과거/파싱불가 → 400', () => {
    expect(() =>
      resolveGrantUpdate({ type: 'paid-until', until: '2026-01-01' }, existing, NOW)
    ).toThrowError(/미래/);
    expect(() =>
      resolveGrantUpdate({ type: 'paid-until', until: 'nope' }, existing, NOW)
    ).toThrowError(/미래/);
  });
  it('알 수 없는 type → 400', () => {
    expect(() => resolveGrantUpdate({ type: 'hack' } as never, existing, NOW)).toThrowError(/type/);
  });
});
