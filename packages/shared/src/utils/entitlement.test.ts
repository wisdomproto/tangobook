import { describe, it, expect } from 'vitest';
import { computeAccess, BETA_SIGNUP_DEADLINE } from './entitlement';

const BETA_DEADLINE = Date.parse(BETA_SIGNUP_DEADLINE);
const NOW = Date.parse('2026-01-15T00:00:00Z');
// 7일 체험/레퍼럴/만료 메커니즘은 베타 1년 무료가 덮어쓰므로, 그 검증은 베타 마감(2027-01-01)
// 이후 시점 + 마감 후 가입 계정으로 한다. 베타 무료 자체 검증은 NOW(2026, 베타 중)로.
const AFTER = Date.parse('2027-06-01T00:00:00Z'); // 베타 마감 후
const DAY = 86_400_000;
const iso = (ms: number) => new Date(ms).toISOString();

describe('computeAccess', () => {
  it('게스트(미로그인) → guest, 미권한', () => {
    const a = computeAccess({ account: null }, NOW);
    expect(a.status).toBe('guest');
    expect(a.isEntitled).toBe(false);
  });

  // ── 베타 프로모: 마감 전 가입 = 가입일 + 1년 무료 ──

  it('베타 중 가입(오늘) → trial, 약 1년(≈365일) 무료', () => {
    const a = computeAccess({ account: { createdAt: iso(NOW) } }, NOW);
    expect(a.status).toBe('trial');
    expect(a.isEntitled).toBe(true);
    expect(a.trialDaysLeft).toBe(365);
  });

  it('베타 중 100일 전 가입 → 여전히 무료(1년 창), 남은 ≈265일', () => {
    const a = computeAccess({ account: { createdAt: iso(NOW - 100 * DAY) } }, NOW);
    expect(a.status).toBe('trial');
    expect(a.trialDaysLeft).toBe(265);
  });

  it('베타 마감 후 가입 → 베타 무료 없음, 기본 7일 체험', () => {
    const a = computeAccess({ account: { createdAt: iso(AFTER - 3 * DAY) } }, AFTER);
    expect(a.status).toBe('trial');
    expect(a.trialDaysLeft).toBe(4);
  });

  it('베타 마감 직전 가입 계정은 마감 후에도 가입일+1년 유지', () => {
    // 마감 30일 전 가입 → 가입일+365일은 마감 이후. 마감 후 시점에도 무료여야 한다.
    const created = BETA_DEADLINE - 30 * DAY;
    const a = computeAccess({ account: { createdAt: iso(created) } }, BETA_DEADLINE + 10 * DAY);
    expect(a.status).toBe('trial');
    expect(a.isEntitled).toBe(true);
  });

  // ── 7일 체험/레퍼럴/구독 메커니즘 (베타 마감 후 = AFTER 시점) ──

  it('체험 중(가입 3일 전) → trial, 남은 4일', () => {
    const a = computeAccess({ account: { createdAt: iso(AFTER - 3 * DAY) } }, AFTER);
    expect(a.status).toBe('trial');
    expect(a.trialDaysLeft).toBe(4);
  });

  it('체험 + 레퍼럴 보너스 7 → 창이 7일 늘어남(기존 동작 보존)', () => {
    const a = computeAccess(
      { account: { createdAt: iso(AFTER - 3 * DAY) }, referralBonusDays: 7 },
      AFTER
    );
    expect(a.status).toBe('trial');
    expect(a.trialDaysLeft).toBe(11);
  });

  it('구독 활성 → subscribed', () => {
    const a = computeAccess(
      {
        account: { createdAt: iso(NOW - 100 * DAY) },
        subscription: { status: 'active', currentPeriodEnd: iso(NOW + 30 * DAY) },
      },
      NOW
    );
    expect(a.status).toBe('subscribed');
    expect(a.isEntitled).toBe(true);
  });

  it('오래된 계정 + 구독 없음 + 보너스 없음 → expired (마감 후)', () => {
    const a = computeAccess({ account: { createdAt: iso(AFTER - 100 * DAY) } }, AFTER);
    expect(a.status).toBe('expired');
    expect(a.isEntitled).toBe(false);
  });

  // ── B 모델: 레퍼럴 보너스는 구독/체험 중 더 나중 종료일 뒤로 이월 ──

  it('구독자가 초대한 보너스는 구독 종료 뒤로 이월된다 (핵심 fix)', () => {
    // 구독이 2일 전 종료(active 상태로 남아있음) + 보너스 7일 → 종료일+7 = 지금+5일 무료.
    const a = computeAccess(
      {
        account: { createdAt: iso(AFTER - 100 * DAY) },
        subscription: { status: 'active', currentPeriodEnd: iso(AFTER - 2 * DAY) },
        referralBonusDays: 7,
      },
      AFTER
    );
    expect(a.status).toBe('trial');
    expect(a.isEntitled).toBe(true);
    expect(a.trialDaysLeft).toBe(5);
  });

  it('구독이 아직 유효하면 보너스가 있어도 subscribed (보너스는 이후에 적용)', () => {
    const a = computeAccess(
      {
        account: { createdAt: iso(NOW - 100 * DAY) },
        subscription: { status: 'active', currentPeriodEnd: iso(NOW + 30 * DAY) },
        referralBonusDays: 7,
      },
      NOW
    );
    expect(a.status).toBe('subscribed');
  });

  it('무기한 구독(currentPeriodEnd null) → subscribed', () => {
    const a = computeAccess(
      {
        account: { createdAt: iso(NOW - 100 * DAY) },
        subscription: { status: 'active', currentPeriodEnd: null },
        referralBonusDays: 7,
      },
      NOW
    );
    expect(a.status).toBe('subscribed');
  });

  it('오래 만료된 체험 + 보너스만(구독 이력 없음) → 여전히 expired(회귀 방지, 마감 후)', () => {
    const a = computeAccess(
      { account: { createdAt: iso(AFTER - 100 * DAY) }, referralBonusDays: 7 },
      AFTER
    );
    expect(a.status).toBe('expired');
  });
});
