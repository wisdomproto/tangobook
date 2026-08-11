import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TRIAL_DAYS, REFERRAL_BONUS_DAYS } from '@tangobook/shared';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TrialBadge } from '../TrialBadge';
import * as authCtx from '@/features/auth/context/AuthContext';
import * as entitlementHook from '@/features/payment/hooks/useEntitlement';

// PAYWALL_ENABLED is true since 2026-07-08 (정식 유료화 ON) → the "정식 오픈 전 · 전권 무료"
// branch is dead in production config; expired now renders nothing (paywall handles the upsell).
//
// ⚠️ TrialBadge 자체는 2026-07-14 사이드바 정리로 **미사용** — 컴포넌트/카피만 보존 중이다.
// 되살릴 때 이 테스트가 계약서 역할을 하도록 남겨둔다.

function mockAuth(account: { id: string; createdAt: string } | null) {
  vi.spyOn(authCtx, 'useAuth').mockReturnValue({ account } as any);
}

function mockEntitlement(
  referralBonusDays = 0,
  paidUntil: string | null = null,
  trialStartedAt: string | null = null
) {
  vi.spyOn(entitlementHook, 'useEntitlement').mockReturnValue({
    paidUntil,
    referralBonusDays,
    trialStartedAt,
  });
}

function renderBadge() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <TrialBadge />
    </QueryClientProvider>
  );
}

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

describe('TrialBadge', () => {
  // 🔴 규칙은 「가입하면 TRIAL_DAYS 무료」 하나뿐이다(2026-08-11, 베타 1년 폐지). 일수를 상수에서
  // 가져와야 기간을 바꿔도 이 테스트가 따라온다 — 숫자를 박아 두면 조용히 낡는다.
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2027-07-01T00:00:00Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('guest(account=null) → 아무것도 렌더하지 않음', () => {
    mockAuth(null);
    mockEntitlement();
    const { container } = renderBadge();
    expect(container).toBeEmptyDOMElement();
  });

  it('체험 중 → "무료 체험 N일 남음" 노출', () => {
    // 가입 2일 전 → TRIAL_DAYS-2 일 남음
    mockAuth({ id: 'a1', createdAt: daysAgo(2) });
    mockEntitlement();
    renderBadge();
    // 'N일' 이 강조 span 으로 분리되므로 p 의 textContent 로 매칭.
    expect(
      screen.getByText(
        (_, el) => el?.tagName === 'P' && /무료 체험 \d+일 남음/.test(el.textContent ?? '')
      )
    ).toBeInTheDocument();
  });

  it('초대 보너스가 남은 일수에 더해짐', () => {
    // 가입 2일 전 + 보너스 → (TRIAL_DAYS-2)+REFERRAL_BONUS_DAYS 일 남음
    mockAuth({ id: 'a1', createdAt: daysAgo(2) });
    mockEntitlement(7);
    renderBadge();
    expect(
      screen.getByText(
        (_, el) =>
          el?.tagName === 'P' &&
          new RegExp(`🎁 무료 체험 ${TRIAL_DAYS - 2 + REFERRAL_BONUS_DAYS}일 남음`).test(
            (el.textContent ?? '').replace(/\s+/g, ' ')
          )
      )
    ).toBeInTheDocument();
  });

  it('체험 만료 + 유료화 ON → 아무것도 렌더하지 않음(페이월이 안내)', () => {
    mockAuth({ id: 'a1', createdAt: daysAgo(TRIAL_DAYS + 5) });
    mockEntitlement();
    const { container } = renderBadge();
    expect(container).toBeEmptyDOMElement();
  });

  it('만료된 기존 계정도 trial_started_at 리셋 시 체험 재시작', () => {
    // 가입이 한참 전(=만료)이지만 방금 리셋 → 오늘부터 다시 체험
    mockAuth({ id: 'a1', createdAt: daysAgo(30) });
    mockEntitlement(0, null, new Date().toISOString());
    renderBadge();
    expect(
      screen.getByText(
        (_, el) =>
          el?.tagName === 'P' &&
          new RegExp(`🎁 무료 체험 ${TRIAL_DAYS}일 남음`).test(
            (el.textContent ?? '').replace(/\s+/g, ' ')
          )
      )
    ).toBeInTheDocument();
  });
});
