/** BookMultiSelectGrid — renders public storybooks, tap toggles selection order badge. */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/features/storybook', () => ({
  useStorybooks: () => ({
    data: [
      // 나레이션(pagesTts) 있는 공개 동화책만 노출 대상
      {
        id: 'b1',
        title: '토끼',
        isPublic: true,
        type: 'storybook',
        coverImage: '',
        koCompletion: { pagesTts: true },
      },
      {
        id: 'b2',
        title: '거북이',
        isPublic: true,
        type: 'storybook',
        coverImage: '',
        koCompletion: { pagesTts: true },
      },
      {
        id: 'p1',
        title: '파닉스',
        isPublic: true,
        type: 'phonics',
        coverImage: '',
        koCompletion: { pagesTts: true },
      },
      {
        id: 'b3',
        title: '숨김책',
        isPublic: false,
        type: 'storybook',
        coverImage: '',
        koCompletion: { pagesTts: true },
      },
      // 나레이션 없는 공개 동화책 → 제외돼야 함
      {
        id: 'b4',
        title: '무음책',
        isPublic: true,
        type: 'storybook',
        coverImage: '',
        koCompletion: { pagesTts: false },
      },
    ],
    isLoading: false,
    isError: false,
  }),
}));

// useLibraryConfig(useQuery) 가 QueryClient 를 요구하므로 목킹. makeCategoryComparator 는 실제 동작 유지.
vi.mock('@/features/library', () => ({
  useLibraryConfig: () => ({ data: undefined }),
  makeCategoryComparator:
    () =>
    (a: string, b: string, fa = 0, fb = 0) =>
      fb - fa,
}));

// useStyleGenreMap(useQuery) 도 QueryClient 요구 → 목킹 (그림풍 드롭박스 추가분).
vi.mock('@/lib/art-style-genre', () => ({
  useStyleGenreMap: () => ({ map: {}, setGenre: () => {}, saving: false }),
}));

import { BookMultiSelectGrid } from './BookMultiSelectGrid';

describe('BookMultiSelectGrid', () => {
  it('renders only public storybooks with narration (no phonics, no private, no silent)', () => {
    render(<BookMultiSelectGrid selectedIds={[]} onToggle={() => {}} />);
    expect(screen.getByText('토끼')).toBeInTheDocument();
    expect(screen.getByText('거북이')).toBeInTheDocument();
    expect(screen.queryByText('파닉스')).not.toBeInTheDocument();
    expect(screen.queryByText('숨김책')).not.toBeInTheDocument();
    // 나레이션(pagesTts) 없는 책은 연속재생 선택기에서 제외
    expect(screen.queryByText('무음책')).not.toBeInTheDocument();
  });

  it('calls onToggle with the tapped book id', () => {
    const onToggle = vi.fn();
    render(<BookMultiSelectGrid selectedIds={[]} onToggle={onToggle} />);
    fireEvent.click(screen.getByText('토끼'));
    expect(onToggle).toHaveBeenCalledWith('b1');
  });

  it('shows selection order badge for selected books', () => {
    render(<BookMultiSelectGrid selectedIds={['b2', 'b1']} onToggle={() => {}} />);
    // 거북이 first (order 1), 토끼 second (order 2). 카테고리 개수는 "N권"이라 숫자 배지와 안 겹침.
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('filters by search query (title)', () => {
    render(<BookMultiSelectGrid selectedIds={[]} onToggle={() => {}} search="토끼" />);
    expect(screen.getByText('토끼')).toBeInTheDocument();
    expect(screen.queryByText('거북이')).not.toBeInTheDocument();
  });
});
