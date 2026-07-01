import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AppShell } from './AppShell';
import * as authCtx from '@/features/auth/context/AuthContext';

function setup(account: { email: string } | null) {
  vi.spyOn(authCtx, 'useAuth').mockReturnValue({
    isConfigured: true,
    loading: false,
    session: account ? ({ user: { id: 'u1' } } as any) : null,
    account: account as any,
    profiles: [],
    activeProfile: null,
    setActiveProfile: vi.fn(),
    refresh: vi.fn(),
    signOut: vi.fn(),
  });
}

function renderShell() {
  return render(
    <MemoryRouter initialEntries={['/library']}>
      <Routes>
        <Route path="/*" element={<AppShell />}>
          <Route index element={<div>CONTENT</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('AppShell sidebar axis visibility', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('guest (account=null) → 동화책만, 연속재생·학습 리포팅·친구 초대·파닉스/어휘/게임 숨김', () => {
    setup(null);
    renderShell();
    expect(screen.getByText('동화책')).toBeInTheDocument();
    expect(screen.queryByText('연속재생')).toBeNull(); // authOnly — 로그인 시만
    expect(screen.queryByText('학습 리포팅')).toBeNull();
    expect(screen.queryByText('친구 초대')).toBeNull();
    expect(screen.queryByText('파닉스')).toBeNull();
    expect(screen.queryByText('어휘')).toBeNull();
    expect(screen.queryByText('학습 게임')).toBeNull();
  });

  it('일반 부모 계정 → 동화책+연속재생+학습 리포팅+친구 초대, 파닉스/어휘/게임 숨김', () => {
    setup({ email: 'someparent@example.com' });
    renderShell();
    expect(screen.getByText('동화책')).toBeInTheDocument();
    expect(screen.getByText('연속재생')).toBeInTheDocument();
    expect(screen.getByText('학습 리포팅')).toBeInTheDocument();
    expect(screen.getByText('친구 초대')).toBeInTheDocument();
    expect(screen.queryByText('파닉스')).toBeNull();
    expect(screen.queryByText('어휘')).toBeNull();
    expect(screen.queryByText('학습 게임')).toBeNull();
  });

  it('개발자 계정(kil210@tangobook.co.kr) → 동화책+연속재생+파닉스+어휘+학습게임 표시', () => {
    setup({ email: 'kil210@tangobook.co.kr' });
    renderShell();
    expect(screen.getByText('동화책')).toBeInTheDocument();
    expect(screen.getByText('연속재생')).toBeInTheDocument();
    expect(screen.getByText('파닉스')).toBeInTheDocument();
    expect(screen.getByText('어휘')).toBeInTheDocument();
    expect(screen.getByText('학습 게임')).toBeInTheDocument();
  });
});
