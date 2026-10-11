import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShell } from './AppShell';
vi.mock('@/features/feedback', () => ({ FeedbackDialog: () => null }));
import * as authCtx from '@/features/auth/context/AuthContext';

function setup(loggedIn = false, activeProfile = null, profiles: unknown[] = []) {
  vi.spyOn(authCtx, 'useAuth').mockReturnValue({
    isConfigured: true,
    loading: false,
    session: loggedIn ? { user: { id: 'u1' } } : null,
    account: null,
    profiles,
    activeProfile,
    setActiveProfile: vi.fn(),
    refresh: vi.fn(),
    signOut: vi.fn(),
  } as unknown as ReturnType<typeof authCtx.useAuth>);
}
function renderShell(path = '/library') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[path]}>
        <AppShell />
      </MemoryRouter>
    </QueryClientProvider>
  );
}
describe('learning shell navigation and parent controls', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    HTMLDialogElement.prototype.showModal = function () {
      this.setAttribute('open', '');
    };
    HTMLDialogElement.prototype.close = function () {
      this.removeAttribute('open');
    };
  });
  it('exposes the same five learning destinations on desktop and mobile', () => {
    setup();
    renderShell();
    for (const name of ['학습 메뉴', '하단 학습 메뉴']) {
      const nav = within(screen.getByRole('navigation', { name }));
      const expected = [
        ['홈', '/library'],
        ['한글', '/library/phonics/korean'],
        ['영어', '/library/phonics/english'],
        ['동화책', '/library/books'],
        ['활동', '/library/activities'],
      ];
      for (const [label, href] of expected)
        expect(nav.getByRole('link', { name: label })).toHaveAttribute('href', href);
      expect(nav.queryByText('부모 메뉴')).toBeNull();
    }
    expect(document.querySelector('aside')).toBeNull();
  });
  it('marks Korean as current on a deep unit route without marking Home', () => {
    setup();
    renderShell('/library/phonics/korean/kr-h1-u01');
    const nav = within(screen.getByRole('navigation', { name: '학습 메뉴' }));
    expect(nav.getByRole('link', { name: '한글' })).toHaveAttribute('aria-current', 'page');
    expect(nav.getByRole('link', { name: '홈' })).not.toHaveAttribute('aria-current');
  });
  it('offers guest sign-in in the parent dialog and keeps parent reports for signed-in accounts', async () => {
    setup();
    const first = renderShell();
    await userEvent.click(screen.getByRole('button', { name: '부모 메뉴' }));
    expect(screen.getByRole('link', { name: '로그인 / 회원가입' })).toHaveAttribute(
      'href',
      '/login'
    );
    expect(screen.queryByRole('link', { name: '학습 리포팅' })).toBeNull();
    first.unmount();
    setup(true);
    renderShell();
    await userEvent.click(screen.getByRole('button', { name: '부모 메뉴' }));
    expect(screen.getByRole('link', { name: '학습 리포팅' })).toHaveAttribute(
      'href',
      '/parent/reports'
    );
    expect(screen.getByRole('link', { name: '부모 설정' })).toHaveAttribute(
      'href',
      '/parent/settings'
    );
    await userEvent.click(screen.getByRole('button', { name: '메뉴 닫기' }));
    expect(screen.queryByRole('link', { name: '학습 리포팅' })).toBeNull();
  });
});
