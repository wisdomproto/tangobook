/**
 * PlaylistLibrarySection — 나의 재생 목록 (LibraryPage 내 섹션)
 *
 * Render policy (2026-07-07 진입점 이전 + 2026-07-08 접기/펴기):
 * - 게스트 (account=null) → null
 * - 로그인 + 로딩 중 → null
 * - 로그인 → 헤더만 (기본 접힘). 헤더 클릭 시 펼침:
 *   - 세트 0개 → "이어재생 만들기" CTA (첫 세트 생성 경로)
 *   - 세트 ≥1 → 카드 행 (＋ 추가 카드 없음)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

  it('로그인 → 기본 접힘: 헤더만, 본문(CTA/세트) 숨김', () => {
    mockPlaylists.data = [{ id: 'p1', name: '밤 동화 세트', bookIds: ['b1'], language: 'ko' }];
    renderSection();
    expect(screen.getByText(/나의 재생 목록/)).toBeInTheDocument();
    expect(screen.queryByText('밤 동화 세트')).toBeNull(); // 접혀 있어 숨김
  });

  it('로그인 + 세트 0개 → 펼치면 "이어재생 만들기" CTA 표시', () => {
    mockPlaylists.data = [];
    renderSection();
    fireEvent.click(screen.getByRole('button', { name: /나의 재생 목록/ }));
    expect(screen.getByText('이어재생 만들기')).toBeInTheDocument();
  });

  it('로그인 + 로딩 중 → 아무것도 렌더하지 않음', () => {
    mockPlaylists.isLoading = true;
    mockPlaylists.data = [];
    const { container } = renderSection();
    expect(container.firstChild).toBeNull();
  });

  it('로그인 + 세트 ≥1 → 펼치면 세트 이름 표시', () => {
    mockPlaylists.data = [
      { id: 'p1', name: '밤 동화 세트', bookIds: ['b1', 'b2'], language: 'ko' },
      { id: 'p2', name: '아침 영어 세트', bookIds: ['b3'], language: 'en' },
    ];
    renderSection();
    fireEvent.click(screen.getByRole('button', { name: /나의 재생 목록/ }));
    expect(screen.getByText('밤 동화 세트')).toBeInTheDocument();
    expect(screen.getByText('아침 영어 세트')).toBeInTheDocument();
  });

  it('로그인 + 세트 ≥1 → 재생목록 추가 카드 없음 (sidebar가 생성 진입점)', () => {
    mockPlaylists.data = [{ id: 'p1', name: '밤 동화 세트', bookIds: ['b1'], language: 'ko' }];
    renderSection();
    expect(screen.queryByLabelText('재생목록 추가')).toBeNull();
  });
});
