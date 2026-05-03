import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
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

describe('GameListViewer language filtering', () => {
  it('lang=ko: korean-block + connect-the-dots 표시, english-block 숨김', () => {
    render(
      <MemoryRouter initialEntries={['/viewer/test?mode=games&lang=ko']}>
        <GameListViewer storybook={mockStorybook} />
      </MemoryRouter>
    );
    expect(screen.getByText('한글 블록')).toBeInTheDocument();
    expect(screen.getByText('단어 그림 그리기')).toBeInTheDocument();
    expect(screen.queryByText('English block')).not.toBeInTheDocument();
  });

  it('lang=en: english-block + connect-the-dots 표시, korean-block 숨김', () => {
    render(
      <MemoryRouter initialEntries={['/viewer/test?mode=games&lang=en']}>
        <GameListViewer storybook={mockStorybook} />
      </MemoryRouter>
    );
    expect(screen.getByText('English block')).toBeInTheDocument();
    expect(screen.getByText('단어 그림 그리기')).toBeInTheDocument();
    expect(screen.queryByText('한글 블록')).not.toBeInTheDocument();
  });
});
