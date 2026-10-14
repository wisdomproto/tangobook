import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { StorybookSummary } from '@tangobook/shared';
import LearningHomePage from './LearningHomePage';
import {
  getUnitProgress,
  markActivityCompleted,
} from '@/features/phonics-learner/lib/progress-store';
import { markJourneyStarted } from '@/features/phonics-learner/lib/learning-journey';

const catalogue = vi.hoisted(() => ({
  books: [] as StorybookSummary[],
  loading: false,
  error: false,
  refetch: vi.fn(),
}));
vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: () => ({ activeProfile: null }),
}));
vi.mock('@/features/storybook/hooks/useStorybooks', () => ({
  useStorybooks: () => ({
    data: catalogue.books,
    isLoading: catalogue.loading,
    isError: catalogue.error,
    refetch: catalogue.refetch,
  }),
}));
vi.mock('@/features/library/hooks/useBookGroups', () => ({
  useBookGroups: () => ({ data: undefined }),
}));
vi.mock('@/features/library/hooks/useLibraryConfig', () => ({
  useLibraryConfig: () => ({ data: undefined }),
}));
vi.mock('@/design-system/primitives/BookCover', () => ({ BookCover: () => <span>표지</span> }));

const showHome = () =>
  render(
    <MemoryRouter initialEntries={['/library']}>
      <Routes>
        <Route path="/library" element={<LearningHomePage />} />
        <Route path="/library/phonics/:lang" element={<p>언어 안에서 모드를 골라요</p>} />
      </Routes>
    </MemoryRouter>
  );
beforeEach(() => {
  localStorage.clear();
  catalogue.books = [];
  catalogue.loading = false;
  catalogue.error = false;
  catalogue.refetch.mockClear();
});
describe('whole language cards lead to the language entry', () => {
  it.each(['한글', '영어'])(
    'makes the complete %s card one link without nested actions',
    (name) => {
      showHome();
      const link = screen.getByRole('link', { name });
      expect(link).toHaveAttribute(
        'href',
        '/library/phonics/' + (name === '한글' ? 'korean' : 'english')
      );
      expect(within(link).getByRole('heading', { name })).toBeDefined();
      expect(link.querySelector('a,button')).toBeNull();
      expect(screen.queryByRole('link', { name: /이어서 학습하기|모드 선택|시작하기/ })).toBeNull();
      fireEvent.click(link);
      expect(screen.getByText('언어 안에서 모드를 골라요')).toBeDefined();
    }
  );
  it('keeps the same language entry for a returning learner and preserves progress', () => {
    markJourneyStarted('korean');
    markActivityCompleted('korean', 'kr-v1-u01', 'listen-1');
    showHome();
    expect(screen.getByRole('link', { name: '한글' })).toHaveAttribute(
      'href',
      '/library/phonics/korean'
    );
    expect(screen.queryByText('ㅏ 배우기')).toBeNull();
    expect(screen.queryByRole('link', { name: '이어서 학습하기' })).toBeNull();
    expect(getUnitProgress('korean', 'kr-v1-u01').completedActivities).toEqual(['listen-1']);
  });
});
describe('recommendation shuffle', () => {
  it('shows a different set of public books after every click without fetching or changing course progress', () => {
    catalogue.books = Array.from(
      { length: 12 },
      (_, i) =>
        ({
          id: String(i),
          title: '책 ' + i,
          isPublic: true,
          category: '세계 명작',
        }) as StorybookSummary
    );
    showHome();
    const recommendations = screen.getByRole('region', { name: '오늘의 추천 도서' });
    const ids = () =>
      within(recommendations)
        .getAllByRole('link')
        .filter((link) => link.getAttribute('href') !== '/library/books')
        .map((link) => link.getAttribute('href'));
    let previous = ids();
    expect(previous).toHaveLength(3);
    for (let i = 0; i < 3; i++) {
      fireEvent.click(screen.getByRole('button', { name: '추천 도서 다시 뽑기' }));
      const next = ids();
      expect(next).toHaveLength(3);
      expect(next.every((id) => !previous.includes(id))).toBe(true);
      previous = next;
    }
    expect(catalogue.refetch).not.toHaveBeenCalled();
    expect(getUnitProgress('korean', 'kr-v1-u01').completedActivities).toEqual([]);
  });
  it('disables shuffle while loading or on an empty catalogue', () => {
    const view = showHome();
    expect(screen.getByRole('button', { name: '추천 도서 다시 뽑기' })).toBeDisabled();
    catalogue.loading = true;
    view.rerender(
      <MemoryRouter>
        <LearningHomePage />
      </MemoryRouter>
    );
    expect(screen.getByRole('button', { name: '추천 도서 다시 뽑기' })).toBeDisabled();
  });
});
