import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { TopBar } from '../TopBar';
import { useSaveStatusStore } from '../../../store/save-status-store';

// Mock useMarketingTheme so we can control/track toggle
const mockToggle = vi.fn();
vi.mock('../../../theme/useMarketingTheme', () => ({
  useMarketingTheme: () => ({
    theme: 'light',
    toggle: mockToggle,
    setTheme: vi.fn(),
  }),
}));

beforeEach(() => {
  useSaveStatusStore.setState({
    pending: 0,
    flushing: false,
    lastError: null,
    lastSavedAt: null,
  });
  mockToggle.mockClear();
});

function renderTopBar(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <TopBar />
    </MemoryRouter>
  );
}

describe('TopBar', () => {
  it('shows "콘텐츠 생성" for /marketing/content', () => {
    renderTopBar('/marketing/content');
    expect(screen.getByText('콘텐츠 생성')).toBeInTheDocument();
  });

  it('shows "프로젝트 설정" for /marketing/settings', () => {
    renderTopBar('/marketing/settings');
    expect(screen.getByText('프로젝트 설정')).toBeInTheDocument();
  });

  it('shows "키워드 / 아이디어" for /marketing/ideas', () => {
    renderTopBar('/marketing/ideas');
    expect(screen.getByText('키워드 / 아이디어')).toBeInTheDocument();
  });

  it('shows "광고 관리" for /marketing/ads', () => {
    renderTopBar('/marketing/ads');
    expect(screen.getByText('광고 관리')).toBeInTheDocument();
  });

  it('shows "사이트 분석" for /marketing/site-analysis', () => {
    renderTopBar('/marketing/site-analysis');
    expect(screen.getByText('사이트 분석')).toBeInTheDocument();
  });

  it('shows empty title for unknown path', () => {
    renderTopBar('/unknown/path');
    const h1 = screen.getByRole('heading');
    expect(h1.textContent).toBe('');
  });

  it('renders a theme toggle button', () => {
    renderTopBar('/marketing/content');
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls theme toggle when theme button is clicked', async () => {
    const user = userEvent.setup();
    renderTopBar('/marketing/content');
    await user.click(screen.getByRole('button'));
    expect(mockToggle).toHaveBeenCalledTimes(1);
  });

  it('renders Moon icon when theme is light', () => {
    renderTopBar('/marketing/content');
    // lucide renders SVG; button title indicates dark mode available
    const btn = screen.getByRole('button');
    expect(btn.getAttribute('title')).toContain('다크 모드');
  });

  it('shows SaveStatusIndicator when there is a saved state', () => {
    useSaveStatusStore.setState({ lastSavedAt: Date.now() });
    renderTopBar('/marketing/content');
    expect(screen.getByText('저장됨')).toBeInTheDocument();
  });
});
