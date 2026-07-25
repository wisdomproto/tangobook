import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PromoBanner } from '../PromoBanner';

// Mock useNavigate so we can assert navigation without a real router
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

// Mock useAuth — guest = account null, logged-in = account object with createdAt
vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock useEntitlement — real subscription data (paidUntil + referralBonusDays)
vi.mock('@/features/payment/hooks/useEntitlement', () => ({
  useEntitlement: vi.fn(),
}));

// Stub InviteButton so we can assert its presence without real API calls
vi.mock('@/features/payment', () => ({
  InviteButton: ({ className }: { className?: string }) => (
    <button className={className}>친구 초대하고 +7일 받기</button>
  ),
}));

import { useAuth } from '@/features/auth/context/AuthContext';
import { useEntitlement } from '@/features/payment/hooks/useEntitlement';

const mockUseAuth = vi.mocked(useAuth);
const mockUseEntitlement = vi.mocked(useEntitlement);

// Recent account (within 7-day trial window). Date.now() in tests ≈ actual runtime.
// Use a createdAt 2 days ago so trialDaysLeft ≈ 5.
const TWO_DAYS_AGO = new Date(Date.now() - 2 * 86_400_000).toISOString();
// Old account — well past any trial window
const OLD_DATE = '2020-01-01T00:00:00Z';

const FAKE_ACCOUNT_RECENT = {
  id: 'acct-1',
  email: 'test@example.com',
  createdAt: TWO_DAYS_AGO,
};

const FAKE_ACCOUNT_OLD = {
  id: 'acct-2',
  email: 'old@example.com',
  createdAt: OLD_DATE,
};

function renderBanner() {
  return render(
    <MemoryRouter>
      <PromoBanner />
    </MemoryRouter>
  );
}

beforeEach(() => {
  mockNavigate.mockClear();
});

describe('PromoBanner', () => {
  describe('guest (no account)', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ account: null } as ReturnType<typeof useAuth>);
      mockUseEntitlement.mockReturnValue({
        paidUntil: null,
        referralBonusDays: 0,
        trialStartedAt: null,
      });
    });

    it('renders the banner region', () => {
      renderBanner();
      expect(screen.getByRole('region', { name: '프로모션 배너' })).toBeInTheDocument();
    });

    it('shows guest headline (beta 1-year-free hook)', () => {
      renderBanner();
      expect(screen.getByText('지금 가입하면 1년 무료!')).toBeInTheDocument();
    });

    it('omits the sub-copy line (slim bar — text simplified)', () => {
      renderBanner();
      expect(screen.queryByText('친구를 초대하면 무료 기간이 서로 7일씩 늘어나요')).toBeNull();
    });

    it('shows start CTA button (not InviteButton)', () => {
      renderBanner();
      expect(screen.getByRole('button', { name: '무료로 시작하기' })).toBeInTheDocument();
    });
  });

  // 가입 완료 사용자(베타 1년 무료 포함) — 전환할 게 없으므로 프로모를 보여주지 않는다.
  // "무료 체험 423일 남음" 같은 카운트다운이 소음이 된다는 사용자 지적(2026-07-25).
  describe('signed-up user in the free window (beta year / trial)', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ account: FAKE_ACCOUNT_RECENT } as ReturnType<typeof useAuth>);
      mockUseEntitlement.mockReturnValue({
        paidUntil: null,
        referralBonusDays: 0,
        trialStartedAt: null,
      });
    });

    it('shows no trial countdown', () => {
      renderBanner();
      expect(
        screen.queryByText(
          (_, el) => el?.tagName === 'P' && /무료 체험 \d+일 남음/.test(el.textContent ?? '')
        )
      ).toBeNull();
    });

    it('shows no promo CTA (neither signup nor share)', () => {
      renderBanner();
      expect(screen.queryByRole('button', { name: '무료로 시작하기' })).toBeNull();
      expect(screen.queryByRole('button', { name: '공유하기' })).toBeNull();
    });

    it('renders nothing at all (bar holds only promo now)', () => {
      const { container } = renderBanner();
      expect(container).toBeEmptyDOMElement();
    });
  });

  // 유료화 ON(PAYWALL_ENABLED=true, 현재 라이브): 체험 만료 + 미구독 오래된 계정 → 구독 유도 copy.
  describe('old account, paywall on (trial expired → subscribe copy)', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ account: FAKE_ACCOUNT_OLD } as ReturnType<typeof useAuth>);
      mockUseEntitlement.mockReturnValue({
        paidUntil: null,
        referralBonusDays: 0,
        trialStartedAt: null,
      });
    });

    it('renders the banner region', () => {
      renderBanner();
      expect(screen.getByRole('region', { name: '프로모션 배너' })).toBeInTheDocument();
    });

    it('shows subscribe headline', () => {
      renderBanner();
      expect(screen.getByText('구독하고 모든 동화를 계속 즐겨요')).toBeInTheDocument();
    });

    it('shows share button', () => {
      renderBanner();
      expect(screen.getByRole('button', { name: '공유하기' })).toBeInTheDocument();
    });
  });

  describe('subscribed user (real paid subscription with future paidUntil)', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ account: FAKE_ACCOUNT_OLD } as ReturnType<typeof useAuth>);
      // paidUntil is in the future → computeAccess sees active subscription
      const futureDate = new Date(Date.now() + 30 * 86_400_000).toISOString();
      mockUseEntitlement.mockReturnValue({
        paidUntil: futureDate,
        referralBonusDays: 0,
        trialStartedAt: null,
      });
    });

    it('renders nothing (no promo for subscribers)', () => {
      const { container } = renderBanner();
      expect(container).toBeEmptyDOMElement();
    });

    it('hides promo copy/CTA for subscribers', () => {
      renderBanner();
      expect(screen.queryByText('구독하고 모든 동화를 계속 즐겨요')).toBeNull();
      expect(screen.queryByRole('button', { name: '무료로 시작하기' })).toBeNull();
      expect(screen.queryByRole('button', { name: '공유하기' })).toBeNull();
    });
  });
});
