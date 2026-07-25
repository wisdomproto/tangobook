import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { GameListViewer } from './GameListViewer';
// 레지스트리 side-effect import (game-registry Map을 채우기 위해 필수)
import '@/features/games/registry';

// Storybook mock (최소 필드만). GameListViewer는 storybook.games만 읽음.
const mockStorybook = {
  id: 'test',
  title: 'Test',
  type: 'storybook',
  targetAge: 5,
  pages: [],
  games: [
    {
      id: 'g1',
      gameType: 'korean-block',
      title: '한글 블록',
      difficulty: 'easy',
      data: {},
      createdAt: '2026-01-01',
    },
    {
      id: 'g2',
      gameType: 'english-block',
      title: 'English block',
      difficulty: 'easy',
      data: {},
      createdAt: '2026-01-01',
    },
    {
      id: 'g3',
      gameType: 'connect-the-dots',
      title: '단어 그림 그리기',
      difficulty: 'easy',
      data: {},
      createdAt: '2026-01-01',
    },
  ],
} as any;

// GameListViewer 는 v2 게임(useGamesList/useRuntimeGame = react-query)을 조회한다.
// bid 없으면 쿼리는 비활성이지만 useQueryClient 는 여전히 필요하므로 Provider 로 감싼다.
function renderWithProviders(ui: ReactNode, path: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, enabled: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('GameListViewer language filtering', () => {
  it('lang=ko: korean-block + connect-the-dots 표시, english-block 숨김', () => {
    renderWithProviders(
      <GameListViewer storybook={mockStorybook} />,
      '/viewer/test?mode=games&lang=ko'
    );
    expect(screen.getByText('한글 블록')).toBeInTheDocument();
    expect(screen.getByText('단어 그림 그리기')).toBeInTheDocument();
    expect(screen.queryByText('English block')).not.toBeInTheDocument();
  });

  it('lang=en: english-block + connect-the-dots 표시, korean-block 숨김', () => {
    renderWithProviders(
      <GameListViewer storybook={mockStorybook} />,
      '/viewer/test?mode=games&lang=en'
    );
    expect(screen.getByText('English block')).toBeInTheDocument();
    expect(screen.getByText('단어 그림 그리기')).toBeInTheDocument();
    expect(screen.queryByText('한글 블록')).not.toBeInTheDocument();
  });
});
