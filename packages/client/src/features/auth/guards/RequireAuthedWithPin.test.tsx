import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RequireAuthedWithPin } from './RequireAuthedWithPin';
import * as authCtx from '../context/AuthContext';
import * as gateHook from '../hooks/useParentGate';

function setup(
  mockAuth: Partial<ReturnType<typeof authCtx.useAuth>>,
  mockGate: Partial<ReturnType<typeof gateHook.useParentGate>>
) {
  vi.spyOn(authCtx, 'useAuth').mockReturnValue({
    isConfigured: true,
    loading: false,
    session: null,
    account: null,
    profiles: [],
    activeProfile: null,
    setActiveProfile: vi.fn(),
    refresh: vi.fn(),
    signOut: vi.fn(),
    ...mockAuth,
  } as any);
  vi.spyOn(gateHook, 'useParentGate').mockReturnValue({
    isUnlocked: false,
    isLockedOut: false,
    failureCount: 0,
    unlock: vi.fn(),
    lock: vi.fn(),
    registerFailure: vi.fn(),
    ...mockGate,
  } as any);
}

describe('RequireAuthedWithPin', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('isConfigured=false → /library redirect', () => {
    setup({ isConfigured: false }, {});
    render(
      <MemoryRouter initialEntries={['/parent']}>
        <Routes>
          <Route
            path="/parent"
            element={
              <RequireAuthedWithPin>
                <div>PROTECTED</div>
              </RequireAuthedWithPin>
            }
          />
          <Route path="/library" element={<div>LIBRARY</div>} />
          <Route path="/login" element={<div>LOGIN</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('LIBRARY')).toBeInTheDocument();
  });

  it('unauthed → /login redirect', () => {
    setup({ session: null }, {});
    render(
      <MemoryRouter initialEntries={['/parent']}>
        <Routes>
          <Route
            path="/parent"
            element={
              <RequireAuthedWithPin>
                <div>PROTECTED</div>
              </RequireAuthedWithPin>
            }
          />
          <Route path="/login" element={<div>LOGIN</div>} />
          <Route path="/library" element={<div>LIBRARY</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('LOGIN')).toBeInTheDocument();
  });

  it('session + hasPin=false → SetPinStep 렌더 (children 차단)', () => {
    setup(
      { session: { user: { id: 'u1' } } as any, account: { id: 'u1', hasPin: false } as any },
      {}
    );
    render(
      <MemoryRouter>
        <RequireAuthedWithPin>
          <div>PROTECTED</div>
        </RequireAuthedWithPin>
      </MemoryRouter>
    );
    expect(screen.queryByText('PROTECTED')).toBeNull();
    expect(screen.getByText(/PIN/i)).toBeInTheDocument();
  });

  it('session + hasPin + gate.isUnlocked=false → ParentGateModal 렌더', () => {
    setup(
      { session: { user: { id: 'u1' } } as any, account: { id: 'u1', hasPin: true } as any },
      { isUnlocked: false }
    );
    render(
      <MemoryRouter>
        <RequireAuthedWithPin>
          <div>PROTECTED</div>
        </RequireAuthedWithPin>
      </MemoryRouter>
    );
    expect(screen.queryByText('PROTECTED')).toBeNull();
    expect(screen.getByText(/부모님만/)).toBeInTheDocument();
  });

  it('세션 + PIN + gate 통과 → children 렌더', () => {
    setup(
      { session: { user: { id: 'u1' } } as any, account: { id: 'u1', hasPin: true } as any },
      { isUnlocked: true }
    );
    render(
      <MemoryRouter>
        <RequireAuthedWithPin>
          <div>PROTECTED</div>
        </RequireAuthedWithPin>
      </MemoryRouter>
    );
    expect(screen.getByText('PROTECTED')).toBeInTheDocument();
  });
});
