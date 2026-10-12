import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LibraryContentOverview } from './LibraryContentOverview';
import type { LibraryContentRow } from '../lib/content-audit';

const mock = vi.hoisted(() => ({ refresh: vi.fn(), error: null as Error | null }));
const count = { have: 2, total: 2, missing: [], broken: [] };
const row: LibraryContentRow = {
  id: 'complete',
  title: '완성 책',
  category: '동화',
  public: true,
  cover: true,
  illustrations: count,
  ko: count,
  en: count,
  english: count,
  words: count,
  vocabularyHidden: false,
  games: { ko: ['korean-page-order'], en: [], stored: [] },
  coloring: { ko: 2, en: 0, total: 2, broken: [] },
  sceneColoring: 2,
  hiddenScenes: 0,
  hiddenPlayable: false,
};
vi.mock('../hooks/useLibraryContentAudit', () => ({
  useLibraryContentAudit: () => ({
    data: {
      generatedAt: '2026-10-12T00:00:00Z',
      excludedPhonics: 95,
      fetchFailed: [],
      rows: [
        row,
        {
          ...row,
          id: 'missing',
          title: '보완할 책',
          illustrations: { ...count, have: 1, missing: ['2쪽'] },
        },
      ],
    },
    isLoading: false,
    refreshing: false,
    progress: { done: 0, total: 0 },
    refresh: mock.refresh,
    error: mock.error,
  }),
}));
beforeEach(() => {
  mock.refresh.mockReset();
  mock.error = null;
});
describe('library overview', () => {
  it('finds incomplete books and exposes the missing page and editor link', () => {
    render(
      <MemoryRouter>
        <LibraryContentOverview />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByLabelText('누락 항목 필터'), { target: { value: 'illust' } });
    expect(screen.queryByRole('link', { name: '완성 책' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: '보완할 책' })).toHaveAttribute(
      'href',
      '/editor2/missing'
    );
    fireEvent.click(screen.getByRole('button', { name: '상세' }));
    expect(screen.getByText('삽화: 2쪽')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('책 제목 또는 ID 검색'), {
      target: { value: '없는 제목' },
    });
    expect(screen.getByText('조건에 맞는 책이 없습니다.')).toBeInTheDocument();
  });
  it('keeps the last snapshot visible on refresh errors and allows retry', () => {
    mock.error = new Error('네트워크 오류');
    render(
      <MemoryRouter>
        <LibraryContentOverview />
      </MemoryRouter>
    );
    expect(screen.getByRole('alert')).toHaveTextContent('네트워크 오류');
    expect(screen.getByRole('link', { name: '완성 책' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '운영 데이터 새로고침' }));
    expect(mock.refresh).toHaveBeenCalledOnce();
  });
});
