import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { AuthContextValue } from '@/features/auth/context/AuthContext';

// Mock useAuth so we control session/loading without Supabase
vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Stub MarketingShell — the shell itself is tested via its own unit tests.
// Here we only care about the auth-guard logic in MarketingLayout.
vi.mock('../components/layout/MarketingShell', () => ({
  MarketingShell: () => (
    <div className="marketing-scope" data-testid="marketing-shell">
      <div data-testid="sidebar" />
      <div data-testid="topbar" />
    </div>
  ),
}));

import { useAuth } from '@/features/auth/context/AuthContext';
import { MarketingLayout } from './MarketingLayout';

const mockUseAuth = vi.mocked(useAuth);

function mockAuth(overrides: Partial<AuthContextValue>) {
  mockUseAuth.mockReturnValue({
    isConfigured: true,
    loading: false,
    session: null,
    account: null,
    profiles: [],
    activeProfile: null,
    setActiveProfile: vi.fn(),
    refresh: vi.fn(),
    signOut: vi.fn(),
    ...overrides,
  } as AuthContextValue);
}

function renderLayout(initialPath = '/marketing/content') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<div data-testid="login-page">login</div>} />
        <Route path="/marketing/*" element={<MarketingLayout />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('MarketingLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the shell with marketing-scope root when session exists', () => {
    const fakeSession = {
      user: { id: 'u1', email: 'test@test.com' },
    } as AuthContextValue['session'];
    mockAuth({ session: fakeSession, loading: false });

    renderLayout();

    // marketing-scope root must be present
    const scope = document.querySelector('.marketing-scope');
    expect(scope).not.toBeNull();

    // Shell parts rendered
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('topbar')).toBeInTheDocument();
  });

  it('shows the marketing password gate when there is no session and not loading', () => {
    mockAuth({ session: null, loading: false });

    renderLayout();

    // Shell must NOT be rendered
    expect(document.querySelector('.marketing-scope')).toBeNull();

    // 미로그인은 /login 리다이렉트가 아니라 MarketingGate(비밀번호 8054 → 소유자 세션 자동 발급).
    expect(screen.queryByTestId('login-page')).toBeNull();
    expect(screen.getByRole('heading', { name: '마케팅 스튜디오' })).toBeInTheDocument();
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument();
  });

  it('renders a loading spinner while auth is loading (no session yet)', () => {
    mockAuth({ session: null, loading: true });

    renderLayout();

    // Neither shell nor login page — just the spinner
    expect(document.querySelector('.marketing-scope')).toBeNull();
    expect(screen.queryByTestId('login-page')).toBeNull();

    // Spinner accessible via aria-label or role
    expect(document.querySelector('[aria-label="로딩 중"]')).not.toBeNull();
  });
});
