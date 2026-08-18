import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LoginGate } from './LoginGate';
import * as authCtx from '@/features/auth/context/AuthContext';

function mockAuth(session: unknown, isConfigured = true) {
  vi.spyOn(authCtx, 'useAuth').mockReturnValue({
    session,
    isConfigured,
    account: null,
    profiles: [],
    activeProfile: null,
    loading: false,
    setActiveProfile: vi.fn(),
    refresh: vi.fn(),
    signOut: vi.fn(),
  } as unknown as ReturnType<typeof authCtx.useAuth>);
}

function renderGate() {
  return render(
    <MemoryRouter>
      <LoginGate>
        <div>독후활동</div>
      </LoginGate>
    </MemoryRouter>
  );
}

/**
 * 🔴 오픈 초반 게이팅(2026-08-13): 읽기는 누구나, **독후활동·학습현황만 로그인**.
 *    이 벽이 사라지면 로그인할 이유가 없어지고, 읽기에까지 번지면 유입이 막힌다.
 */
describe('LoginGate', () => {
  it('미로그인이면 벽이 뜬다 — URL 직행도 막아야 하므로 라우트에 붙는다', () => {
    mockAuth(null);
    renderGate();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('로그인했으면 벽이 없다', () => {
    mockAuth({ user: { id: 'u1' } });
    renderGate();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByText('독후활동')).toBeInTheDocument();
  });

  it('Supabase 미설정(게스트 전용 빌드)에선 가입 경로가 없으므로 막지 않는다', () => {
    mockAuth(null, false);
    renderGate();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('벽이 떠도 자식은 계속 렌더된다 — 뒤에 뭐가 있는지 보여야 가입 이유가 된다', () => {
    mockAuth(null);
    renderGate();
    expect(screen.getByText('독후활동')).toBeInTheDocument();
  });
});
