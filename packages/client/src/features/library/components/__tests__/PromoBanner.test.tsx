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
      mockUseEntitlement.mockReturnValue({ paidUntil: null, referralBonusDays: 0 });
    });

    it('renders the banner region', () => {
      renderBanner();
      expect(screen.getByRole('region', { name: '프로모션 배너' })).toBeInTheDocument();
    });

    it('shows login headline', () => {
      renderBanner();
      expect(screen.getByText('로그인하면 7일 무료 체험')).toBeInTheDocument();
    });

    it('shows referral sub-copy', () => {
      renderBanner();
      expect(screen.getByText('친구 초대하면 +7일 무료')).toBeInTheDocument();
    });

    it('shows login CTA button (not InviteButton)', () => {
      renderBanner();
      expect(screen.getByRole('button', { name: '로그인하고 시작하기' })).toBeInTheDocument();
    });
  });

  describe('trial user (account recent, no paid subscription)', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ account: FAKE_ACCOUNT_RECENT } as ReturnType<typeof useAuth>);
      mockUseEntitlement.mockReturnValue({ paidUntil: null, referralBonusDays: 0 });
    });

    it('renders the banner region', () => {
      renderBanner();
      expect(screen.getByRole('region', { name: '프로모션 배너' })).toBeInTheDocument();
    });

    it('shows trial days remaining in headline', () => {
      renderBanner();
      // trialDaysLeft is ceil((7d - 2d elapsed)) = 5
      expect(screen.getByText(/무료 체험 \d+일 남음/)).toBeInTheDocument();
    });

    it('shows invite sub-copy', () => {
      renderBanner();
      expect(screen.getByText('친구 초대하면 +7일 늘어나요')).toBeInTheDocument();
    });

    it('shows InviteButton (not login button)', () => {
      renderBanner();
      expect(screen.queryByRole('button', { name: '로그인하고 시작하기' })).toBeNull();
      // InviteButton stub renders this text
      expect(screen.getByRole('button', { name: '친구 초대하고 +7일 받기' })).toBeInTheDocument();
    });
  });

  // 유료화 OFF(PAYWALL_ENABLED=false, 출시 전): 오래된 계정도 "만료"가 아니라 전체 무료 상태.
  // "만료"처럼 보이던 버그 수정 후 긍정 톤 + 초대 예고 copy 를 보여준다.
  describe('old account, paywall off (pre-launch → free-for-all copy, not expired)', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ account: FAKE_ACCOUNT_OLD } as ReturnType<typeof useAuth>);
      mockUseEntitlement.mockReturnValue({ paidUntil: null, referralBonusDays: 0 });
    });

    it('renders the banner region', () => {
      renderBanner();
      expect(screen.getByRole('region', { name: '프로모션 배너' })).toBeInTheDocument();
    });

    it('shows positive free-for-all headline (no "expired" language)', () => {
      renderBanner();
      expect(screen.getByText('지금은 모든 동화 무료 🎉')).toBeInTheDocument();
    });

    it('shows referral-preview sub-copy', () => {
      renderBanner();
      expect(screen.getByText('친구 초대하면 정식 오픈 후 +7일')).toBeInTheDocument();
    });

    it('shows InviteButton', () => {
      renderBanner();
      expect(screen.getByRole('button', { name: '친구 초대하고 +7일 받기' })).toBeInTheDocument();
    });
  });

  describe('subscribed user (real paid subscription with future paidUntil)', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ account: FAKE_ACCOUNT_OLD } as ReturnType<typeof useAuth>);
      // paidUntil is in the future → computeAccess sees active subscription
      const futureDate = new Date(Date.now() + 30 * 86_400_000).toISOString();
      mockUseEntitlement.mockReturnValue({ paidUntil: futureDate, referralBonusDays: 0 });
    });

    it('renders nothing (returns null)', () => {
      renderBanner();
      expect(screen.queryByRole('region', { name: '프로모션 배너' })).toBeNull();
    });

    it('renders no button', () => {
      renderBanner();
      expect(screen.queryByRole('button')).toBeNull();
    });
  });
});
