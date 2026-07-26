/** ParentReportsPage — tab visibility + parent-friendly header tests. */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ── Mocks (hoisted — vi.mock calls run before imports) ────────────────────

const mockAuth = {
  isConfigured: true,
  loading: false,
  session: { user: { id: 'u1' } } as any,
  account: { id: 'u1', email: 'parent@example.com', hasPin: true } as any,
  profiles: [],
  activeProfile: { id: 'p1', name: '아이' } as any,
  setActiveProfile: vi.fn(),
  refresh: vi.fn(),
  signOut: vi.fn(),
};
vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: () => mockAuth,
}));

const mockEvents = { data: [] as any[], isLoading: false };
vi.mock('@/features/learning', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/learning')>();
  return {
    ...actual,
    useLearningEvents: () => mockEvents,
    // Heavy section components → lightweight stubs so render stays fast
    StorybookReportSection: () => <div data-testid="storybook-section">동화책 섹션</div>,
    PhonicsReportSection: () => <div data-testid="phonics-section">파닉스 섹션</div>,
    VocabularyTabContent: () => <div data-testid="vocab-section">어휘 섹션</div>,
    RewardsOverviewCard: () => <div data-testid="rewards-card">보상</div>,
    HoriInventoryCard: () => <div data-testid="hori-card">호리</div>,
    PlaygroundStatsCard: () => <div data-testid="playground-card">놀이터</div>,
    LanguageTabs: () => <div />,
  };
});

vi.mock('@/features/storybook/hooks/useStorybooks', () => ({
  useStorybooks: () => ({ data: [] }),
}));

import ParentReportsPage from './ParentReportsPage';

function renderPage() {
  return render(
    <MemoryRouter>
      <ParentReportsPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
  mockAuth.account = { id: 'u1', email: 'parent@example.com', hasPin: true } as any;
  mockAuth.activeProfile = { id: 'p1', name: '아이' } as any;
  mockEvents.data = [];
});

// ─────────────────────────────────────────────────────────────────────────────

describe('ParentReportsPage — non-dev parent', () => {
  beforeEach(() => {
    mockAuth.account = { id: 'u1', email: 'someparent@example.com', hasPin: true } as any;
  });

  it('shows the 파닉스 tab — 부모가 보는 탭이다 (2026-07-26)', () => {
    renderPage();
    const tabs = screen.getAllByRole('button').map((b) => b.textContent ?? '');
    expect(tabs.some((x) => x.includes('파닉스'))).toBe(true);
  });

  it('opens the 파닉스 section when that tab is tapped', () => {
    renderPage();
    const phonicsTab = screen
      .getAllByRole('button')
      .find((b) => b.textContent?.includes('파닉스'))!;
    fireEvent.click(phonicsTab);
    expect(screen.getByTestId('phonics-section')).toBeInTheDocument();
  });

  it('does NOT show 어휘 tab', () => {
    renderPage();
    expect(screen.queryByText('어휘')).toBeNull();
  });

  it('does NOT show 활동 현황 tab', () => {
    renderPage();
    expect(screen.queryByText('활동 현황')).toBeNull();
  });

  it('shows 동화책 content by default', () => {
    renderPage();
    expect(screen.getByTestId('storybook-section')).toBeInTheDocument();
  });

  it('shows exactly the two parent tabs (동화책·파닉스)', () => {
    renderPage();
    const tabs = screen
      .getAllByRole('button')
      .map((b) => b.textContent ?? '')
      .filter((x) => /동화책|파닉스|어휘|활동 현황/.test(x));
    expect(tabs).toHaveLength(2);
  });
});

describe('ParentReportsPage — dev account', () => {
  beforeEach(() => {
    mockAuth.account = { id: 'u1', email: 'kil210@tangobook.co.kr', hasPin: true } as any;
  });

  it('shows all 4 tabs as clickable buttons', () => {
    renderPage();
    // Each tab is a <button>. Use getAllByRole to find tab buttons by text.
    const buttons = screen.getAllByRole('button');
    const tabLabels = buttons.map((b) => b.textContent ?? '');
    expect(tabLabels.some((t) => t.includes('동화책'))).toBe(true);
    expect(tabLabels.some((t) => t.includes('파닉스'))).toBe(true);
    expect(tabLabels.some((t) => t.includes('어휘'))).toBe(true);
    expect(tabLabels.some((t) => t.includes('활동 현황'))).toBe(true);
  });
});

describe('ParentReportsPage — header', () => {
  it('does NOT show the word "이벤트" (removed dev jargon)', () => {
    renderPage();
    expect(screen.queryByText(/이벤트/)).toBeNull();
  });

  it('shows child name in header', () => {
    renderPage();
    expect(screen.getByText(/아이/)).toBeInTheDocument();
  });

  // 주간 요약 카피("이번 주 …")는 2026-07-02 히어로 리디자인으로 WeeklyHeroCard 로 이동 —
  // 해당 동작은 learning/components/WeeklyHeroCard.test.tsx 가 검증한다.
  it('header stays a single title line (no weekly numbers — WeeklyHeroCard owns them)', () => {
    renderPage();
    expect(screen.queryByText(/이번 주/)).toBeNull();
  });
});

describe('ParentReportsPage — early returns', () => {
  it('shows login required when isConfigured=false', () => {
    const orig = mockAuth.isConfigured;
    (mockAuth as any).isConfigured = false;
    renderPage();
    expect(screen.getByText('로그인이 필요해요')).toBeInTheDocument();
    (mockAuth as any).isConfigured = orig;
  });

  it('shows profile selection prompt when no activeProfile', () => {
    const orig = mockAuth.activeProfile;
    mockAuth.activeProfile = null;
    renderPage();
    expect(screen.getByText('프로필을 먼저 선택해주세요')).toBeInTheDocument();
    mockAuth.activeProfile = orig;
  });
});
