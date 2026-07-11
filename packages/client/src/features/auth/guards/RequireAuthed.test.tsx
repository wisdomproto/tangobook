import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RequireAuthed } from './RequireAuthed';
import * as authCtx from '../context/AuthContext';

function setup(mockAuth: Partial<ReturnType<typeof authCtx.useAuth>>) {
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
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path={path}
          element={
            <RequireAuthed>
              <div>PROTECTED</div>
            </RequireAuthed>
          }
        />
        <Route path="/login" element={<div>LOGIN</div>} />
        <Route path="/library" element={<div>LIBRARY</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('RequireAuthed', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('loading 중에는 아무것도 렌더하지 않음 (리다이렉트 깜빡임 방지)', () => {
    setup({ loading: true });
    renderAt('/parent');
    expect(screen.queryByText('PROTECTED')).toBeNull();
    expect(screen.queryByText('LOGIN')).toBeNull();
  });

  it('isConfigured=false (게스트 모드) → /library 리다이렉트', () => {
    setup({ isConfigured: false });
    renderAt('/parent');
    expect(screen.getByText('LIBRARY')).toBeInTheDocument();
  });

  it('미로그인 → /login 리다이렉트 (children 차단)', () => {
    setup({ session: null });
    renderAt('/subscribe');
    expect(screen.queryByText('PROTECTED')).toBeNull();
    expect(screen.getByText('LOGIN')).toBeInTheDocument();
  });

  it('로그인 세션 있으면 children 렌더', () => {
    setup({ session: { user: { id: 'u1' } } as any });
    renderAt('/parent');
    expect(screen.getByText('PROTECTED')).toBeInTheDocument();
  });
});
