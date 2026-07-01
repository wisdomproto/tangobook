/**
 * PlaylistLibrarySection — 나의 재생 목록 (LibraryPage 내 섹션)
 * - 로그인 + 세트 있음 → 세트 이름 + 추가 카드 표시
 * - 로그인 + 세트 없음 → 추가 카드만 표시
 * - 게스트 (account=null) → 아무것도 렌더하지 않음
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ---- mocks ----
const mockAuth: { account: { id: string } | null } = { account: { id: 'acc-1' } };
vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: () => mockAuth,
}));

type Playlist = { id: string; name: string; bookIds: string[]; language: string };
const mockPlaylists: { data: Playlist[]; isLoading: boolean } = {
  data: [],
  isLoading: false,
};
const mockDeleteMutate = vi.fn();
vi.mock('../hooks/usePlaylists', () => ({
  usePlaylists: () => mockPlaylists,
  useDeletePlaylist: () => ({ mutate: mockDeleteMutate }),
}));

vi.mock('@/features/storybook', () => ({
  useStorybooks: () => ({ data: [] }),
}));

const mockSetQueue = vi.fn();
vi.mock('../store/playlist.store', () => ({
  usePlaylistStore: {
    getState: () => ({ setQueue: mockSetQueue }),
  },
}));

import { PlaylistLibrarySection } from './PlaylistLibrarySection';

function renderSection() {
  return render(
    <MemoryRouter>
      <PlaylistLibrarySection />
    </MemoryRouter>
  );
}

beforeEach(() => {
  mockAuth.account = { id: 'acc-1' };
  mockPlaylists.data = [];
  mockPlaylists.isLoading = false;
  vi.clearAllMocks();
});

describe('PlaylistLibrarySection', () => {
  it('게스트(account=null) → 아무것도 렌더하지 않음', () => {
    mockAuth.account = null;
    const { container } = renderSection();
    expect(container.firstChild).toBeNull();
  });

  it('로그인 + 세트 없음 → 섹션 헤더 + 추가 카드만 표시', () => {
    mockPlaylists.data = [];
    renderSection();
    expect(screen.getByText(/나의 재생 목록/)).toBeInTheDocument();
    // "재생목록 추가" add card
    expect(screen.getByLabelText('재생목록 추가')).toBeInTheDocument();
    // no playlist names
    expect(screen.queryByText('밤 동화 세트')).toBeNull();
  });

  it('로그인 + 세트 있음 → 세트 이름들 + 추가 카드 표시', () => {
    mockPlaylists.data = [
      { id: 'p1', name: '밤 동화 세트', bookIds: ['b1', 'b2'], language: 'ko' },
      { id: 'p2', name: '아침 영어 세트', bookIds: ['b3'], language: 'en' },
    ];
    renderSection();
    expect(screen.getByText(/나의 재생 목록/)).toBeInTheDocument();
    expect(screen.getByText('밤 동화 세트')).toBeInTheDocument();
    expect(screen.getByText('아침 영어 세트')).toBeInTheDocument();
    // add card still present
    expect(screen.getByLabelText('재생목록 추가')).toBeInTheDocument();
  });
});
