import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
  // TrialBadge(사이드바 무료-체험 칩)가 useEntitlement→useQuery 를 쓰므로 QueryClient 필요.
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/library']}>
        <Routes>
          <Route path="/*" element={<AppShell />}>
            <Route index element={<div>CONTENT</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('AppShell sidebar axis visibility', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('guest (account=null) → 동화책·어휘 게임·파닉스, 부모 메뉴·개발자 축 숨김', () => {
    setup(null);
    renderShell();
    // 일반 노출 3축 — 파닉스는 유닛 전부 공개되며 2026-07-23 부활했다.
    expect(screen.getByText('동화책')).toBeInTheDocument();
    expect(screen.getByText('어휘 게임')).toBeInTheDocument();
    expect(screen.getByText('파닉스')).toBeInTheDocument();
    expect(screen.queryByText('연속재생')).toBeNull(); // 사이드바에서 제거 — 메인화면 「묶어 보기」로 이전
    expect(screen.queryByText('부모 메뉴')).toBeNull(); // 로그인 시만
    expect(screen.queryByText('어휘')).toBeNull(); // devOnly
    expect(screen.queryByText('학습 게임')).toBeNull(); // devOnly
  });

  it('일반 부모 계정 → 부모 메뉴 노출(기본 접힘 — 펼쳐야 리포팅·초대가 보인다)', () => {
    setup({ email: 'someparent@example.com' });
    renderShell();
    expect(screen.getByText('동화책')).toBeInTheDocument();
    expect(screen.queryByText('연속재생')).toBeNull();
    // 부모 작업은 접이식 메뉴 안(2026-07-14) — 접힌 상태에선 항목이 렌더되지 않는다.
    expect(screen.getByText('부모 메뉴')).toBeInTheDocument();
    expect(screen.queryByText('학습 리포팅')).toBeNull();
    expect(screen.queryByText('친구 초대')).toBeNull();
    expect(screen.queryByText('어휘')).toBeNull(); // devOnly
    expect(screen.queryByText('학습 게임')).toBeNull(); // devOnly
  });

  it('부모 메뉴를 펼치면 학습 리포팅·친구 초대·로그아웃이 나온다', async () => {
    const user = userEvent.setup();
    setup({ email: 'someparent@example.com' });
    renderShell();
    await user.click(screen.getByText('부모 메뉴'));
    expect(screen.getByText('학습 리포팅')).toBeInTheDocument();
    expect(screen.getByText('친구 초대')).toBeInTheDocument();
    // 로그아웃은 헤더에서 이 자리로 복귀(2026-07-25) — 그 자리는 아이 프로필 칩이 가져갔다.
    expect(screen.getByText('로그아웃')).toBeInTheDocument();
  });

  it('개발자 계정(kil210@tangobook.co.kr) → 개발자 전용 축(어휘·학습 게임)까지 표시', () => {
    setup({ email: 'kil210@tangobook.co.kr' });
    renderShell();
    expect(screen.getByText('동화책')).toBeInTheDocument();
    expect(screen.queryByText('연속재생')).toBeNull(); // 메인화면으로 이전
    expect(screen.getByText('파닉스')).toBeInTheDocument();
    expect(screen.getByText('어휘')).toBeInTheDocument();
    expect(screen.getByText('학습 게임')).toBeInTheDocument();
  });
});
