/** ParentReportsPage — tab visibility + parent-friendly header tests. */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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

  it('does NOT show 파닉스 tab', () => {
    renderPage();
    expect(screen.queryByText('파닉스')).toBeNull();
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

  it('hides the tab bar entirely (no Chip buttons rendered)', () => {
    renderPage();
    // When only one tab is visible, no Chip tab bar is rendered at all.
    // Tab chips are <button> elements. The storybook section h2 still says "동화책"
    // but there should be no button with that label.
    const buttons = screen.queryAllByRole('button');
    const tabButtons = buttons.filter((b) => b.textContent?.includes('동화책'));
    expect(tabButtons).toHaveLength(0);
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

  it('shows "이번 주 N권 읽었어요" when there are books this week', () => {
    // Inject a page_read event with lastPage=true completed this week
    const now = new Date();
    mockEvents.data = [
      {
        id: 'e1',
        event_type: 'page_read',
        created_at: now.toISOString(),
        storybook_id: 'book-1',
        profile_id: 'p1',
        metadata: { lastPage: true, totalPages: 5, lang: 'ko' },
      },
    ];
    renderPage();
    expect(screen.getByText(/이번 주 1권 읽었어요/)).toBeInTheDocument();
  });

  it('shows "아직 없어요" message when no books read this week', () => {
    mockEvents.data = [];
    renderPage();
    expect(screen.getByText(/이번 주 읽은 책이 아직 없어요/)).toBeInTheDocument();
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
