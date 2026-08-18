import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { AccessState } from '@tangobook/shared';
import { ActivityGate } from './ActivityGate';
import * as authCtx from '@/features/auth/context/AuthContext';
import * as accessHook from '../hooks/useAccess';

function mock(session: unknown, isEntitled: boolean, isConfigured = true) {
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
  vi.spyOn(accessHook, 'useAccess').mockReturnValue({
    status: isEntitled ? 'trial' : session ? 'expired' : 'guest',
    isEntitled,
    trialEndsAt: null,
    trialDaysLeft: 0,
  } satisfies AccessState);
}

const renderGate = () =>
  render(
    <MemoryRouter>
      <ActivityGate>
        <div>독후활동</div>
      </ActivityGate>
    </MemoryRouter>
  );

/**
 * 🔴 오픈 초반 게이팅(2026-08-13): 읽기는 누구나, **독후활동·학습현황만 계정 뒤에**.
 * 🔴 벽이 두 종류인 게 핵심이다 — 이미 가입한 사람에게 "가입하세요"는 막다른 길이다.
 */
describe('ActivityGate', () => {
  it('미로그인 → 가입 벽', () => {
    mock(null, false);
    renderGate();
    expect(screen.getByText(/회원가입/)).toBeInTheDocument();
  });

  it('🔴 로그인했지만 체험이 끝났으면 → 구독 안내(가입 벽 아님)', () => {
    mock({ user: { id: 'u1' } }, false);
    renderGate();
    expect(screen.queryByText(/회원가입하고/)).toBeNull();
    expect(screen.getByText(/무료 체험이 끝났어요/)).toBeInTheDocument();
  });

  it('로그인 + 유효 권한이면 벽 없음', () => {
    mock({ user: { id: 'u1' } }, true);
    renderGate();
    expect(screen.getByText('독후활동')).toBeInTheDocument();
    expect(screen.queryByText(/회원가입하고|무료 체험이 끝났어요/)).toBeNull();
  });

  it('Supabase 미설정이면 막지 않는다 — 가입·결제 경로 자체가 없다', () => {
    mock(null, false, false);
    renderGate();
    expect(screen.queryByText(/회원가입하고|무료 체험이 끝났어요/)).toBeNull();
  });

  it('벽이 떠도 자식은 렌더된다 — 뒤에 뭐가 있는지 보여야 살 이유가 된다', () => {
    mock(null, false);
    renderGate();
    expect(screen.getByText('독후활동')).toBeInTheDocument();
  });
});
