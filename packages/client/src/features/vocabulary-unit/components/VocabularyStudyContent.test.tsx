import type { ReactNode } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Storybook, VocabularyUnit } from '@tangobook/shared';
import { VocabularyStudyContent } from './VocabularyStudyContent';

vi.mock('@/features/auth/context/AuthContext', () => ({ useAuth: () => ({}) }));
vi.mock('@/features/learning/hooks/useLearningEvents', () => ({
  useLearningEvents: () => ({ data: [], isSuccess: true }),
}));
vi.mock('@/features/rewards', () => ({ useStarBalance: () => ({ refetch: vi.fn() }) }));
vi.mock('@/features/games/hooks/useColoringSheets', () => ({
  useColoringBookIndex: () => ({}),
  coloringBookId: () => 'test',
  countColoringSheets: () => 1,
  useColoringItems: () => ({ items: [{ word: 'cat' }], loading: false }),
}));
vi.mock('@/features/games/hooks/useGameAssetPreload', () => ({
  useGameAssetPreload: () => ({ ready: true }),
}));
vi.mock('@/features/games/hooks/usePhonicsMap', () => ({
  usePhonicsMap: () => ({ mapRef: { current: {} }, loading: false }),
}));
vi.mock('@/features/learning', () => ({
  VocabSourceProvider: ({ children }: { children: ReactNode }) => children,
}));
vi.mock('@/features/games/components/players/ColoringPlayer', () => ({
  ColoringPlayer: ({ onBack }: { onBack: () => void }) => (
    <button onClick={onBack}>게임 닫기</button>
  ),
}));

const unit = {
  id: 'book-test',
  language: 'ko',
  source: 'storybook',
  storybookId: 'test',
  words: ['cat', 'dog', 'sun'].map((word, i) => ({
    word,
    korean: ['고양이', '강아지', '해'][i],
    images: [{ imageUrl: `/${word}.webp` }],
  })),
} as unknown as VocabularyUnit;
const book = { id: 'test', pages: [], artStyle: 'paper-craft' } as unknown as Storybook;

describe('direct vocabulary game menu', () => {
  it.each(['ko', 'en'] as const)(
    'shows only four vocabulary buttons in %s without groups or example words',
    (lang) => {
      render(<VocabularyStudyContent unit={unit} storybook={book} lang={lang} />);
      expect(screen.getAllByRole('button')).toHaveLength(4);
      expect(
        screen.getByRole('button', { name: lang === 'ko' ? '한글 블록' : '영어 블록' })
      ).toBeEnabled();
      expect(screen.getByRole('button', { name: '그림짝 맞추기' })).toBeEnabled();
      expect(screen.queryByText('동화 내용 놀이')).toBeNull();
      expect(screen.queryByText('단어 둘러보기')).toBeNull();
      expect(screen.queryByText('고양이')).toBeNull();
      expect(screen.queryByText('다른 놀이')).toBeNull();
    }
  );
  it('opens a game directly and closes back to the same four choices', async () => {
    render(<VocabularyStudyContent unit={unit} storybook={book} lang="ko" />);
    await userEvent.click(screen.getByRole('button', { name: '색칠하기' }));
    await userEvent.click(await screen.findByRole('button', { name: '게임 닫기' }));
    expect(await screen.findByRole('button', { name: '그림짝 맞추기' })).toBeEnabled();
    await waitFor(() => expect(screen.queryByRole('button', { name: '게임 닫기' })).toBeNull());
  });
  it('keeps unavailable games disabled for units without usable words', () => {
    render(<VocabularyStudyContent unit={{ ...unit, words: [] }} lang="ko" />);
    expect(screen.getByRole('button', { name: '그림짝 맞추기' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '한글 블록' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '따라 쓰기' })).toBeDisabled();
  });
});
