import { beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { FreePlayRound } from '../lib/free-play';
import { decomposeWord, decomposeEnglishWord } from '@tangobook/shared';
import type { FreePlayKind } from '../lib/free-play-options';
import {
  getUnitProgress,
  markActivityCompleted,
} from '@/features/phonics-learner/lib/progress-store';
import FreePlayPage from './FreePlayPage';
import { HomePlaySection } from './HomePlaySection';

const state = vi.hoisted(() => ({
  data: null as FreePlayRound | null,
  isPending: false,
  isError: false,
  sessions: [] as string[],
  languages: [] as string[],
}));
vi.mock('../hooks/useFreePlayRound', () => ({
  useFreePlayRound: (_kind: string, session: string, lang: string) => {
    state.sessions.push(session);
    state.languages.push(lang);
    return state;
  },
}));
vi.mock('@/lib/useSeo', () => ({ useSeo: vi.fn() }));
vi.mock('@/features/games/components/players/KoreanBlockPlayer', () => ({
  KoreanBlockPlayer: ({
    onBack,
    initialInputMode,
  }: {
    onBack: () => void;
    initialInputMode: string;
  }) => <button onClick={onBack}>블록 실행 {initialInputMode}</button>,
}));
vi.mock('@/features/games/components/players/KoreanWordWritingPlayer', () => ({
  KoreanWordWritingPlayer: ({
    onBack,
    onComplete,
  }: {
    onBack: () => void;
    onComplete: (score: number, total: number) => void;
  }) => (
    <>
      <button onClick={onBack}>쓰기 실행</button>
      <button onClick={() => onComplete(100, 100)}>쓰기 완료</button>
    </>
  ),
}));
vi.mock('@/features/games/components/players/HiddenObjectPlayer', () => ({
  HiddenObjectPlayer: ({ onBack, lang }: { onBack: () => void; lang: string }) => (
    <button onClick={onBack} data-lang={lang}>
      찾기 실행
    </button>
  ),
}));
vi.mock('@/features/games/components/players/ColoringPlayer', () => ({
  ColoringPlayer: ({
    onBack,
    items,
  }: {
    onBack: () => void;
    items: { lang: string; language: string; ttsUrl?: string }[];
  }) => (
    <button
      onClick={onBack}
      data-lang={items[0].lang}
      data-audio={items[0].ttsUrl}
      data-language={items[0].language}
    >
      색칠 실행
    </button>
  ),
}));
vi.mock('@/features/games/components/players/EnglishBlockPlayer', () => ({
  EnglishBlockPlayer: ({
    onBack,
    initialInputMode,
  }: {
    onBack: () => void;
    initialInputMode: string;
  }) => <button onClick={onBack}>영어 블록 실행 {initialInputMode}</button>,
}));
vi.mock('@/features/games/components/players/EnglishWordWritingPlayer', () => ({
  EnglishWordWritingPlayer: ({
    onBack,
    onComplete,
  }: {
    onBack: () => void;
    onComplete: (score: number, total: number) => void;
  }) => (
    <>
      <button onClick={onBack}>영어 쓰기 실행</button>
      <button onClick={() => onComplete(100, 100)}>영어 쓰기 완료</button>
    </>
  ),
}));
vi.mock('@/features/games/components/GameResultScreen', () => ({
  GameResultScreen: ({ onRestart, onBack }: { onRestart: () => void; onBack: () => void }) => (
    <>
      <button onClick={onRestart}>다시 놀이</button>
      <button onClick={onBack}>홈으로</button>
    </>
  ),
}));

const open = (kind: string, query = '') =>
  render(
    <MemoryRouter initialEntries={[`/library/play/${kind}${query}`]}>
      <Routes>
        <Route path="/library/play/:kind" element={<FreePlayPage />} />
        <Route
          path="/library"
          element={
            <>
              <h1>학습 홈</h1>
              <HomePlaySection />
            </>
          }
        />
      </Routes>
    </MemoryRouter>
  );
function fixture(kind: FreePlayKind): FreePlayRound {
  const bookId = 'book';
  if (kind === 'coloring')
    return {
      kind,
      bookId,
      entry: {
        key: 'one',
        group: '동화',
        section: '나무',
        word: '나무',
        lineartUrl: 'line.webp',
        originalUrl: 'tree.webp',
      },
    };
  if (kind === 'hidden-object')
    return {
      kind,
      bookId,
      data: { type: 'hidden-object', scenes: [{ sceneImageUrl: 'scene.webp', targets: [] }] },
    };
  if (kind === 'blocks')
    return {
      kind,
      bookId,
      data: {
        type: 'korean-block',
        items: [{ word: '나무', imageUrl: 'tree.webp', syllables: decomposeWord('나무') }],
      },
    };
  return {
    kind,
    bookId,
    data: {
      type: 'korean-word-writing',
      items: [
        {
          word: '나무',
          displayWord: '나무',
          imageUrl: 'tree.webp',
          referenceImageUrl: 'tree.webp',
        },
      ],
    },
  };
}
beforeEach(() => {
  localStorage.clear();
  state.data = null;
  state.isPending = false;
  state.isError = false;
  state.sessions = [];
  state.languages = [];
});

it.each([
  ['blocks', '영어 블록 실행 screen'],
  ['writing', '영어 쓰기 실행'],
  ['coloring', '색칠 실행'],
  ['hidden-object', '찾기 실행'],
] as const)(
  'starts English %s directly and keeps English selected on return',
  async (kind, label) => {
    const data = fixture(kind);
    if (data.kind === 'blocks')
      data.data = {
        type: 'english-block',
        items: [
          {
            word: 'cat',
            korean: '고양이',
            imageUrl: 'cat.webp',
            letters: decomposeEnglishWord('cat'),
          },
        ],
      };
    if (data.kind === 'writing') data.data.type = 'english-word-writing';
    if (data.kind === 'coloring') {
      data.entry.word = 'tree';
      data.ttsUrl = 'tree-en.mp3';
    }
    state.data = data;
    open(kind, '?lang=en');
    const player = await screen.findByRole('button', { name: label });
    expect(state.languages.at(-1)).toBe('en');
    if (kind === 'coloring' || kind === 'hidden-object')
      expect(player).toHaveAttribute('data-lang', 'en');
    if (kind === 'coloring') {
      expect(player).toHaveAttribute('data-language', 'english');
      expect(player).toHaveAttribute('data-audio', 'tree-en.mp3');
    }
    fireEvent.click(player);
    expect(screen.getByRole('button', { name: '영어' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('link', { name: '영어 블록' })).toHaveAttribute(
      'href',
      '/library/play/blocks?lang=en'
    );
  }
);
it.each([
  ['blocks', '블록 실행 screen'],
  ['writing', '쓰기 실행'],
  ['coloring', '색칠 실행'],
  ['hidden-object', '찾기 실행'],
] as const)(
  '%s starts directly and returns home without changing curriculum',
  async (kind, label) => {
    state.data = fixture(kind);
    markActivityCompleted('korean', 'kr-v1-u01', 'listen-1');
    open(kind);
    const player = await screen.findByRole('button', { name: label });
    expect(screen.queryByText(/난이도를 골라|책 고르기|커리큘럼 모드/)).toBeNull();
    fireEvent.click(player);
    expect(screen.getByRole('heading', { name: '학습 홈' })).toBeDefined();
    expect(getUnitProgress('korean', 'kr-v1-u01').completedActivities).toEqual(['listen-1']);
  }
);
it('has a home exit while loading and restores document scrolling', () => {
  state.isPending = true;
  document.body.style.overflow = 'auto';
  open('blocks');
  expect(screen.getByRole('status')).toHaveTextContent('놀이를 준비');
  expect(document.body.style.overflow).toBe('hidden');
  fireEvent.click(screen.getByRole('button', { name: '홈으로' }));
  expect(document.body.style.overflow).toBe('auto');
  document.body.style.overflow = '';
});
it.each([false, true])(
  'can restart an empty/error request (%s) without returning to a chooser',
  (isError) => {
    state.isError = isError;
    open('writing');
    const before = state.sessions.at(-1);
    fireEvent.click(screen.getByRole('button', { name: '다시 준비하기' }));
    expect(state.sessions.at(-1)).not.toBe(before);
  }
);
it('returns invalid play routes to the home', () => {
  open('not-a-game');
  expect(screen.getByRole('heading', { name: '학습 홈' })).toBeDefined();
  expect(state.sessions).toHaveLength(0);
});

it('replays a completed writing round without silently switching its words', async () => {
  state.data = {
    kind: 'writing',
    bookId: 'book',
    data: {
      type: 'korean-word-writing',
      items: [
        {
          word: '나무',
          displayWord: '나무',
          imageUrl: 'tree.webp',
          referenceImageUrl: 'tree.webp',
        },
      ],
    },
  };
  open('writing');
  fireEvent.click(await screen.findByRole('button', { name: '쓰기 완료' }));
  const session = state.sessions.at(-1);
  fireEvent.click(await screen.findByRole('button', { name: '다시 놀이' }));
  expect(await screen.findByRole('button', { name: '쓰기 실행' })).toBeDefined();
  expect(state.sessions.at(-1)).toBe(session);
});
