/**
 * PlaylistLibrarySection — 묶어 보기 (LibraryPage 내 섹션)
 *
 * Render policy (2026-07-24 개편):
 * - 카테고리 묶음은 게스트·로그인 **동일하게** 노출 (이전엔 게스트에게 섹션 자체가 없었음)
 * - 기본 펼침 (이전엔 접힘)
 * - 로그인 사용자만 묶음 아래 "내가 만든 세트" 영역
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

type BookSummary = {
  id: string;
  title: string;
  category?: string;
  isPublic?: boolean;
  type?: string;
};
const mockBooks: { data: BookSummary[] } = { data: [] };
vi.mock('@/features/storybook', () => ({
  useStorybooks: () => mockBooks,
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockSetQueue = vi.fn();
vi.mock('../store/playlist.store', () => ({
  usePlaylistStore: {
    getState: () => ({ setQueue: mockSetQueue }),
  },
}));

import { PlaylistLibrarySection } from './PlaylistLibrarySection';

/** 공룡 3권 + 식물 3권 → 묶음 2개가 나오는 최소 데이터 */
const SAMPLE_BOOKS: BookSummary[] = [
  { id: 'd1', title: '01. 티라노', category: '공룡 친구들', isPublic: true },
  { id: 'd2', title: '02. 브라키오', category: '공룡 친구들', isPublic: true },
  { id: 'd3', title: '03. 스테고', category: '공룡 친구들', isPublic: true },
  { id: 'p1', title: '01. 딸기', category: '식물 친구들', isPublic: true },
  { id: 'p2', title: '02. 나팔꽃', category: '식물 친구들', isPublic: true },
  { id: 'p3', title: '03. 버섯', category: '식물 친구들', isPublic: true },
];

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
  mockBooks.data = SAMPLE_BOOKS;
  vi.clearAllMocks();
});

describe('PlaylistLibrarySection', () => {
  it('게스트에게도 카테고리 묶음이 보인다', () => {
    mockAuth.account = null;
    renderSection();
    expect(screen.getByText(/묶어 보기/)).toBeInTheDocument();
    expect(screen.getByText('공룡 친구들')).toBeInTheDocument();
    expect(screen.getByText('식물 친구들')).toBeInTheDocument();
  });

  it('게스트에게는 "내가 만든 세트" 영역이 없다', () => {
    mockAuth.account = null;
    renderSection();
    expect(screen.queryByText('내가 만든 세트')).toBeNull();
    expect(screen.queryByText('이어재생 만들기')).toBeNull();
  });

  it('로그인 사용자도 같은 묶음을 본다', () => {
    renderSection();
    expect(screen.getByText('공룡 친구들')).toBeInTheDocument();
    expect(screen.getByText('식물 친구들')).toBeInTheDocument();
  });

  it('기본이 펼침이다 (토글 클릭 없이 묶음이 보인다)', () => {
    renderSection();
    expect(screen.getByText('공룡 친구들')).toBeInTheDocument();
  });

  it('헤더를 누르면 접힌다', () => {
    renderSection();
    fireEvent.click(screen.getByRole('button', { name: /묶어 보기/ }));
    expect(screen.queryByText('공룡 친구들')).toBeNull();
  });

  it('로그인 + 내 세트 0개 → 묶음과 "이어재생 만들기" CTA 가 함께 보인다', () => {
    mockPlaylists.data = [];
    renderSection();
    expect(screen.getByText('공룡 친구들')).toBeInTheDocument();
    expect(screen.getByText('이어재생 만들기')).toBeInTheDocument();
  });

  it('로그인 + 내 세트 ≥1 → 묶음 아래에 내 세트가 보인다', () => {
    mockPlaylists.data = [
      { id: 'x1', name: '밤 동화 세트', bookIds: ['d1', 'd2'], language: 'ko' },
    ];
    renderSection();
    expect(screen.getByText('공룡 친구들')).toBeInTheDocument();
    expect(screen.getByText('내가 만든 세트')).toBeInTheDocument();
    expect(screen.getByText('밤 동화 세트')).toBeInTheDocument();
  });

  it('묶음 카드에는 삭제 버튼이 없다(저장된 세트가 아니므로)', () => {
    mockPlaylists.data = [];
    renderSection();
    expect(screen.queryByLabelText('공룡 친구들 세트 삭제')).toBeNull();
  });

  it('묶음 수정 → 책 목록을 실은 빌더로 이동한다', () => {
    renderSection();
    fireEvent.click(screen.getByLabelText('공룡 친구들 세트 편집'));
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.stringContaining('/continuous/new?books=d1%2Cd2%2Cd3')
    );
  });

  it('책이 없으면 게스트에게는 섹션을 렌더하지 않는다', () => {
    mockAuth.account = null;
    mockBooks.data = [];
    const { container } = renderSection();
    expect(container.firstChild).toBeNull();
  });
});
