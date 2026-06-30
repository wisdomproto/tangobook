import { describe, it, expect } from 'vitest';
import {
  computeAccess,
  canReadBook,
  isSubscriptionActive,
  TRIAL_DAYS,
  REFERRAL_BONUS_DAYS,
  extendPaidUntil,
} from '@tangobook/shared';

const NOW = Date.parse('2026-06-20T00:00:00Z');
const DAY = 86_400_000;
const ago = (d: number) => new Date(NOW - d * DAY).toISOString();
const ahead = (d: number) => new Date(NOW + d * DAY).toISOString();

describe('computeAccess', () => {
  it('게스트(미로그인) = not entitled', () => {
    expect(computeAccess({ account: null }, NOW)).toMatchObject({
      status: 'guest',
      isEntitled: false,
    });
  });

  it('가입 직후 = trial, entitled, ~7일 남음', () => {
    const a = computeAccess({ account: { createdAt: ago(0) } }, NOW);
    expect(a.status).toBe('trial');
    expect(a.isEntitled).toBe(true);
    expect(a.trialDaysLeft).toBe(TRIAL_DAYS);
  });

  it('가입 8일 경과 = expired, not entitled', () => {
    const a = computeAccess({ account: { createdAt: ago(8) } }, NOW);
    expect(a.status).toBe('expired');
    expect(a.isEntitled).toBe(false);
    expect(a.trialDaysLeft).toBe(0);
  });

  it('레퍼럴 +7일이면 8일차에도 trial 유지', () => {
    const a = computeAccess(
      { account: { createdAt: ago(8) }, referralBonusDays: REFERRAL_BONUS_DAYS },
      NOW
    );
    expect(a.status).toBe('trial');
    expect(a.isEntitled).toBe(true);
  });

  it('구독 active 면 체험 만료여도 entitled', () => {
    const a = computeAccess(
      { account: { createdAt: ago(100) }, subscription: { status: 'active' } },
      NOW
    );
    expect(a.status).toBe('subscribed');
    expect(a.isEntitled).toBe(true);
  });
});

describe('isSubscriptionActive', () => {
  it('active + 기간 남음 = true / 만료 = false', () => {
    expect(isSubscriptionActive({ status: 'active', currentPeriodEnd: ahead(1) }, NOW)).toBe(true);
    expect(isSubscriptionActive({ status: 'active', currentPeriodEnd: ago(1) }, NOW)).toBe(false);
  });
  it('canceled/expired = false, null sub = false', () => {
    expect(isSubscriptionActive({ status: 'canceled' }, NOW)).toBe(false);
    expect(isSubscriptionActive(null, NOW)).toBe(false);
  });
  it('currentPeriodEnd 미지정 active = 무기한 true', () => {
    expect(isSubscriptionActive({ status: 'active' }, NOW)).toBe(true);
  });
});

describe('canReadBook', () => {
  it('무료 책(미지정/true)은 게스트도 열람', () => {
    expect(canReadBook({}, { isEntitled: false })).toBe(true);
    expect(canReadBook({ isAccessibleForFree: true }, { isEntitled: false })).toBe(true);
  });
  it('유료 책(false)은 entitlement 필요', () => {
    expect(canReadBook({ isAccessibleForFree: false }, { isEntitled: false })).toBe(false);
    expect(canReadBook({ isAccessibleForFree: false }, { isEntitled: true })).toBe(true);
  });
});

describe('extendPaidUntil', () => {
  const NOW = Date.parse('2026-07-01T00:00:00Z');
  it('미보유(null)면 now + days', () => {
    expect(extendPaidUntil(null, 30, NOW)).toBe('2026-07-31T00:00:00.000Z');
  });
  it('미래 만료가 남아있으면 그 위에 누적', () => {
    const future = '2026-07-10T00:00:00.000Z';
    expect(extendPaidUntil(future, 30, NOW)).toBe('2026-08-09T00:00:00.000Z');
  });
  it('과거 만료면 now 기준 재시작', () => {
    expect(extendPaidUntil('2026-06-01T00:00:00Z', 30, NOW)).toBe('2026-07-31T00:00:00.000Z');
  });
});

describe('computeAccess with paid_until subscription', () => {
  const NOW = Date.parse('2026-07-01T00:00:00Z');
  it('paid_until 미래 → subscribed/entitled', () => {
    const a = computeAccess(
      {
        account: { createdAt: '2026-01-01T00:00:00Z' },
        subscription: { status: 'active', currentPeriodEnd: '2026-08-01T00:00:00Z' },
      },
      NOW
    );
    expect(a.status).toBe('subscribed');
    expect(a.isEntitled).toBe(true);
  });
});
