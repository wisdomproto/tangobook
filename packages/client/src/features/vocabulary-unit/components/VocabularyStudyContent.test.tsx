import type { ReactNode } from 'react';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Storybook, VocabularyUnit } from '@tangobook/shared';
import { VocabularyStudyContent } from './VocabularyStudyContent';

const sceneState = vi.hoisted(() => ({ count: 0 }));
vi.mock('@/features/games/hooks/useSceneColoringItems', () => ({
  useSceneColoringCount: () => sceneState.count,
  useSceneColoringItems: () => ({ items: [{ word: 'scene-test' }], isPending: false }),
}));
vi.mock('@/features/games/components/players/HiddenObjectPlayer', () => ({
  HiddenObjectPlayer: ({ onBack }: { onBack: () => void }) => (
    <button onClick={onBack}>숨은그림 닫기</button>
  ),
}));

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
  ColoringPlayer: ({ onBack, items }: { onBack: () => void; items: { word: string }[] }) => (
    <div>
      <p>{items[0].word}</p>
      <button onClick={onBack}>게임 닫기</button>
    </div>
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
  beforeEach(() => {
    sceneState.count = 0;
  });
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
    await userEvent.click(screen.getByRole('button', { name: '어휘 색칠하기' }));
    await userEvent.click(await screen.findByRole('button', { name: '게임 닫기' }));
    expect(await screen.findByRole('button', { name: '그림짝 맞추기' })).toBeEnabled();
    await waitFor(() => expect(screen.queryByRole('button', { name: '게임 닫기' })).toBeNull());
  });
  it.each(['어휘 색칠하기', '장면 색칠하기'])(
    'places %s outside a transformed page host',
    async (name) => {
      sceneState.count = 2;
      const { container } = render(
        <div style={{ transform: 'translateY(20px)' }}>
          <VocabularyStudyContent unit={unit} storybook={book} lang="ko" />
        </div>
      );
      await userEvent.click(screen.getByRole('button', { name }));
      const close = await screen.findByRole('button', { name: '게임 닫기' });
      expect(container.contains(close)).toBe(false);
      expect(close.closest('[data-learning-overlay-root]')?.parentElement).toBe(document.body);
      await userEvent.click(close);
      await waitFor(() => expect(screen.queryByRole('button', { name: '게임 닫기' })).toBeNull());
      expect(screen.getByRole('button', { name })).toBeEnabled();
    }
  );
  it('keeps unavailable games disabled for units without usable words', () => {
    render(<VocabularyStudyContent unit={{ ...unit, words: [] }} lang="ko" />);
    expect(screen.getByRole('button', { name: '그림짝 맞추기' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '한글 블록' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '따라 쓰기' })).toBeDisabled();
  });
  it.each(['ko', 'en'] as const)(
    'adds prepared hidden-object and scene-coloring choices for the selected book in %s',
    async (lang) => {
      sceneState.count = 2;
      const withScenes = {
        ...book,
        hiddenObjectScenes: [
          {
            id: 'hobj-test',
            sceneImageUrl: '/test-scene.webp',
            hotspots: ['cat', 'dog'].map((objectName, i) => ({
              objectName,
              x: 0.1 + i * 0.3,
              y: 0.1,
              w: 0.2,
              h: 0.2,
              labels: { ko: ['고양이', '강아지'][i], en: objectName },
            })),
          },
        ],
      } as unknown as Storybook;
      render(<VocabularyStudyContent unit={unit} storybook={withScenes} lang={lang} />);
      expect(screen.getAllByRole('button')).toHaveLength(6);
      await userEvent.click(screen.getByRole('button', { name: '숨은그림 찾기' }));
      await userEvent.click(await screen.findByRole('button', { name: '숨은그림 닫기' }));
      await waitFor(() =>
        expect(screen.queryByRole('button', { name: '숨은그림 닫기' })).toBeNull()
      );
      await userEvent.click(screen.getByRole('button', { name: '장면 색칠하기' }));
      expect(screen.getByText('scene-test')).toBeVisible();
      await userEvent.click(screen.getByRole('button', { name: '게임 닫기' }));
      expect(screen.getAllByRole('button')).toHaveLength(6);
      expect(screen.queryByText('동화 내용 놀이')).toBeNull();
    }
  );
  it('retains scene coloring for books that deliberately hide vocabulary', () => {
    sceneState.count = 2;
    render(
      <VocabularyStudyContent unit={unit} storybook={{ ...book, hideVocabulary: true }} lang="ko" />
    );
    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(screen.getByRole('button', { name: '장면 색칠하기' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: '한글 블록' })).toBeNull();
  });
});
