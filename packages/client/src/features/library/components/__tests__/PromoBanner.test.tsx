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

// Mock useAuth — guest = account null, logged-in = account object
vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock useAccess — controls access state
vi.mock('@/features/access', () => ({
  useAccess: vi.fn(),
}));

import { useAuth } from '@/features/auth/context/AuthContext';
import { useAccess } from '@/features/access';

const mockUseAuth = vi.mocked(useAuth);
const mockUseAccess = vi.mocked(useAccess);

// Minimal account object (just needs to be truthy / non-null)
const FAKE_ACCOUNT = {
  id: 'acct-1',
  email: 'test@example.com',
  createdAt: '2026-06-01T00:00:00Z',
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
      mockUseAccess.mockReturnValue({
        status: 'subscribed',
        isEntitled: true,
        trialEndsAt: null,
        trialDaysLeft: 0,
      });
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

    it('shows login CTA button', () => {
      renderBanner();
      expect(screen.getByRole('button', { name: '로그인하고 시작하기' })).toBeInTheDocument();
    });
  });

  describe('trial user (account set, status trial)', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ account: FAKE_ACCOUNT } as ReturnType<typeof useAuth>);
      mockUseAccess.mockReturnValue({
        status: 'trial',
        isEntitled: true,
        trialEndsAt: '2026-07-08T00:00:00Z',
        trialDaysLeft: 5,
      });
    });

    it('renders the banner region', () => {
      renderBanner();
      expect(screen.getByRole('region', { name: '프로모션 배너' })).toBeInTheDocument();
    });

    it('shows trial days remaining in headline', () => {
      renderBanner();
      expect(screen.getByText('무료 체험 5일 남음')).toBeInTheDocument();
    });

    it('shows subscribe CTA button', () => {
      renderBanner();
      expect(screen.getByRole('button', { name: '이용권 보기' })).toBeInTheDocument();
    });
  });

  describe('expired user (account set, status expired)', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ account: FAKE_ACCOUNT } as ReturnType<typeof useAuth>);
      mockUseAccess.mockReturnValue({
        status: 'expired',
        isEntitled: false,
        trialEndsAt: null,
        trialDaysLeft: 0,
      });
    });

    it('renders the banner region', () => {
      renderBanner();
      expect(screen.getByRole('region', { name: '프로모션 배너' })).toBeInTheDocument();
    });

    it('shows expired headline', () => {
      renderBanner();
      expect(screen.getByText('이용권으로 모든 책을 열어요')).toBeInTheDocument();
    });

    it('shows subscribe CTA button', () => {
      renderBanner();
      expect(screen.getByRole('button', { name: '이용권 보기' })).toBeInTheDocument();
    });
  });

  describe('subscribed user (account set, status subscribed)', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ account: FAKE_ACCOUNT } as ReturnType<typeof useAuth>);
      mockUseAccess.mockReturnValue({
        status: 'subscribed',
        isEntitled: true,
        trialEndsAt: null,
        trialDaysLeft: 0,
      });
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
