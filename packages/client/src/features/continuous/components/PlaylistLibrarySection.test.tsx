/**
 * PlaylistLibrarySection — 나의 재생 목록 (LibraryPage 내 섹션)
 *
 * Render policy (2026-07-07 — 연속재생 진입점을 사이드바→이 섹션으로 이전):
 * - 게스트 (account=null) → null
 * - 로그인 + 로딩 중 → null
 * - 로그인 + 세트 0개 → 헤더 + "이어재생 만들기" CTA (첫 세트 생성 경로)
 * - 로그인 + 세트 ≥1 → 헤더 + 카드 행 (＋ 추가 카드 없음)
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

  it('로그인 + 세트 0개 → 헤더 + "이어재생 만들기" CTA 표시', () => {
    mockPlaylists.data = [];
    renderSection();
    expect(screen.getByText(/나의 재생 목록/)).toBeInTheDocument();
    expect(screen.getByText('이어재생 만들기')).toBeInTheDocument();
  });

  it('로그인 + 로딩 중 → 아무것도 렌더하지 않음', () => {
    mockPlaylists.isLoading = true;
    mockPlaylists.data = [];
    const { container } = renderSection();
    expect(container.firstChild).toBeNull();
  });

  it('로그인 + 세트 ≥1 → 섹션 헤더 + 세트 이름 표시', () => {
    mockPlaylists.data = [
      { id: 'p1', name: '밤 동화 세트', bookIds: ['b1', 'b2'], language: 'ko' },
      { id: 'p2', name: '아침 영어 세트', bookIds: ['b3'], language: 'en' },
    ];
    renderSection();
    expect(screen.getByText(/나의 재생 목록/)).toBeInTheDocument();
    expect(screen.getByText('밤 동화 세트')).toBeInTheDocument();
    expect(screen.getByText('아침 영어 세트')).toBeInTheDocument();
  });

  it('로그인 + 세트 ≥1 → 재생목록 추가 카드 없음 (sidebar가 생성 진입점)', () => {
    mockPlaylists.data = [{ id: 'p1', name: '밤 동화 세트', bookIds: ['b1'], language: 'ko' }];
    renderSection();
    expect(screen.queryByLabelText('재생목록 추가')).toBeNull();
  });
});
