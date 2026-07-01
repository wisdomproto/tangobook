/** ContinuousHomePage — empty state (logged-in, no sets) + guest login hint. */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const mockAuth = { account: { id: 'acc-1' } as { id: string } | null };
vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: () => mockAuth,
}));

const mockPlaylists = { data: [] as unknown[], isLoading: false };
vi.mock('../hooks/usePlaylists', () => ({
  usePlaylists: () => mockPlaylists,
  useDeletePlaylist: () => ({ mutate: vi.fn() }),
}));

vi.mock('@/features/storybook', () => ({
  useStorybooks: () => ({ data: [] }),
}));

import ContinuousHomePage from './ContinuousHomePage';

function renderPage() {
  return render(
    <MemoryRouter>
      <ContinuousHomePage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  mockAuth.account = { id: 'acc-1' };
  mockPlaylists.data = [];
});

describe('ContinuousHomePage', () => {
  it('shows empty state when logged in with no saved sets', () => {
    renderPage();
    expect(screen.getByText('저장된 세트가 없어요')).toBeInTheDocument();
    // "새 세트 만들기" appears (header button + empty-state action)
    expect(screen.getAllByText(/새 세트 만들기/).length).toBeGreaterThan(0);
  });

  it('shows login hint for guests (no account)', () => {
    mockAuth.account = null;
    renderPage();
    expect(screen.getByText(/로그인하면 세트를 저장할 수 있어요/)).toBeInTheDocument();
  });
});
