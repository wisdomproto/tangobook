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
// 🔴 베타 1년 무료 폐지(2026-08-11) — 규칙은 「가입하면 TRIAL_DAYS 무료」 하나뿐이라
// 시점을 나눠 볼 이유가 없어졌다. AFTER 는 남은 케이스가 쓰던 앵커라 그대로 둔다.
const AFTER = Date.parse('2027-06-20T00:00:00Z');
const DAY = 86_400_000;
const ago = (d: number) => new Date(NOW - d * DAY).toISOString();
const ahead = (d: number) => new Date(NOW + d * DAY).toISOString();
const agoA = (d: number) => new Date(AFTER - d * DAY).toISOString();

describe('computeAccess', () => {
  it('게스트(미로그인) = not entitled', () => {
    expect(computeAccess({ account: null }, NOW)).toMatchObject({
      status: 'guest',
      isEntitled: false,
    });
  });

  it('가입 직후 = trial, entitled, 체험 일수만큼 남음', () => {
    const a = computeAccess({ account: { createdAt: agoA(0) } }, AFTER);
    expect(a.status).toBe('trial');
    expect(a.isEntitled).toBe(true);
    expect(a.trialDaysLeft).toBe(TRIAL_DAYS);
  });

  it('체험 기간이 지나면 expired, not entitled', () => {
    const a = computeAccess({ account: { createdAt: agoA(TRIAL_DAYS + 1) } }, AFTER);
    expect(a.status).toBe('expired');
    expect(a.isEntitled).toBe(false);
    expect(a.trialDaysLeft).toBe(0);
  });

  it('레퍼럴 보너스가 붙으면 체험 종료 다음 날에도 trial 유지', () => {
    const a = computeAccess(
      { account: { createdAt: agoA(TRIAL_DAYS + 1) }, referralBonusDays: REFERRAL_BONUS_DAYS },
      AFTER
    );
    expect(a.status).toBe('trial');
    expect(a.isEntitled).toBe(true);
  });

  it('trialStartedAt override → 가입일 무시하고 그 시각부터 다시 체험', () => {
    // 가입 100일 전(가입일 기준이면 만료)이나 리셋으로 오늘 시작 → 체험 일수만큼 남음
    const a = computeAccess(
      { account: { createdAt: agoA(TRIAL_DAYS + 70) }, trialStartedAt: agoA(0) },
      AFTER
    );
    expect(a.status).toBe('trial');
    expect(a.trialDaysLeft).toBe(TRIAL_DAYS);
  });

  it('trialStartedAt null 이면 가입일 폴백(기존 동작, 마감 후)', () => {
    const a = computeAccess({ account: { createdAt: agoA(0) }, trialStartedAt: null }, AFTER);
    expect(a.status).toBe('trial');
    expect(a.trialDaysLeft).toBe(TRIAL_DAYS);
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
