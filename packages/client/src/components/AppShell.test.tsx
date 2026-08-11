import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
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

/**
 * 축 라벨은 사이드바와 하단 탭바(모바일, 2026-08-01)에 **둘 다** 나온다 → 전역 getByText 는
 * "Found multiple elements" 로 죽는다. 이 스위트는 사이드바의 노출 규칙을 재는 것이므로
 * 사이드바로 범위를 좁힌다(탭바는 같은 목록을 쓰므로 여기서 규칙이 지켜지면 탭바도 같다).
 */
const sidebar = () => within(document.querySelector('aside') as HTMLElement);

describe('AppShell sidebar axis visibility', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('guest (account=null) → 동화책·어휘 게임·파닉스, 부모 메뉴·개발자 축 숨김', () => {
    setup(null);
    renderShell();
    // 일반 노출 3축 — 파닉스는 유닛 전부 공개되며 2026-07-23 부활했다.
    expect(sidebar().getByText('동화책')).toBeInTheDocument();
    expect(sidebar().getByText('어휘 게임')).toBeInTheDocument();
    expect(sidebar().getByText('파닉스')).toBeInTheDocument();
    expect(screen.queryByText('연속재생')).toBeNull(); // 사이드바에서 제거 — 메인화면 「묶어 보기」로 이전
    expect(screen.queryByText('부모 메뉴')).toBeNull(); // 로그인 시만
    expect(sidebar().queryByText('어휘')).toBeNull(); // devOnly
    expect(screen.queryByText('학습 게임')).toBeNull(); // devOnly
  });

  it('하단 탭바(모바일)엔 아이 축만 — 부모 진입은 헤더 톱니바퀴', () => {
    setup(null);
    renderShell();
    const bar = within(screen.getByRole('navigation', { name: '메뉴' }));
    expect(bar.getByText('동화책')).toBeInTheDocument();
    expect(bar.getByText('파닉스')).toBeInTheDocument();
    // 🔴 아이 엄지가 닿는 아래엔 부모 메뉴 진입을 두지 않는다 — 드로어는 헤더 ⚙️ 로만 연다.
    expect(bar.queryByText('메뉴')).toBeNull();
    expect(bar.queryByRole('button')).toBeNull();
    // '준비 중'(어휘)은 링크가 아니라 탭바에 넣지 않는다.
    expect(bar.queryByText('어휘')).toBeNull();
    expect(screen.getByLabelText('메뉴 열기')).toBeInTheDocument();
  });

  it('일반 부모 계정 → 학습 리포팅은 바로 노출, 나머지 부모 작업은 접이식 안', () => {
    setup({ email: 'someparent@example.com' });
    renderShell();
    expect(sidebar().getByText('동화책')).toBeInTheDocument();
    expect(screen.queryByText('연속재생')).toBeNull();
    // 학습 리포팅은 접이식 밖으로 승격(2026-07-25) — 접힌 상태에서도 보인다.
    expect(screen.getByText('학습 리포팅')).toBeInTheDocument();
    // 나머지 부모 작업은 여전히 접이식 안이라 접힌 상태에선 렌더되지 않는다.
    expect(screen.getByText('부모 메뉴')).toBeInTheDocument();
    expect(screen.queryByText('친구 초대')).toBeNull();
    expect(sidebar().queryByText('어휘')).toBeNull(); // devOnly
    expect(screen.queryByText('학습 게임')).toBeNull(); // devOnly
  });

  it('부모 메뉴를 펼치면 친구 초대·로그아웃이 나온다', async () => {
    const user = userEvent.setup();
    setup({ email: 'someparent@example.com' });
    renderShell();
    await user.click(screen.getByText('부모 메뉴'));
    expect(screen.getByText('친구 초대')).toBeInTheDocument();
    // 로그아웃은 헤더에서 이 자리로 복귀(2026-07-25) — 그 자리는 아이 프로필 칩이 가져갔다.
    expect(screen.getByText('로그아웃')).toBeInTheDocument();
  });

  // 🔴 어휘·학습 게임 축은 **개발자에게도 안 보인다**(2026-08-09 사용자 — 사이드바에서 제거).
  //    라우트·페이지·게임 코드는 보존(직접 URL 도달 가능)이고 사이드바 버튼만 뺐다.
  it('개발자 계정도 사이드바는 3축(동화책·어휘 게임·파닉스)만', () => {
    setup({ email: 'kil210@tangobook.co.kr' });
    renderShell();
    expect(sidebar().getByText('동화책')).toBeInTheDocument();
    expect(screen.queryByText('연속재생')).toBeNull(); // 메인화면으로 이전
    expect(sidebar().getByText('파닉스')).toBeInTheDocument();
    expect(sidebar().queryByText('어휘')).toBeNull();
    expect(screen.queryByText('학습 게임')).toBeNull();
  });
});
