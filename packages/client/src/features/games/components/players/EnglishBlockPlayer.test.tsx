import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EnglishBlockPlayer } from './EnglishBlockPlayer';

const mocks = vi.hoisted(() => ({
  log: vi.fn(),
  audio: vi.fn(),
  correct: vi.fn(),
  camera: vi.fn(),
  resolve: vi.fn(async () => '/word.mp3'),
  notify: vi.fn(),
  map: { current: new Map<string, string>() },
}));
vi.mock('../GameHeader', () => ({
  GameHeader: ({ title, current, total }: { title: string; current: number; total: number }) => (
    <div>
      {title} {current}/{total}
    </div>
  ),
}));
vi.mock('../MobileLandscapeGate', () => ({
  MobileLandscapeGate: ({ children }: { children: ReactNode }) => children,
}));
vi.mock('../FeedbackOverlay', () => ({ FeedbackOverlay: () => null }));
vi.mock('@/features/phonics-learner/components/PhonicsBackdrop', () => ({
  PhonicsBackdrop: () => null,
}));
vi.mock('@/features/learning/context/VocabSourceContext', () => ({
  useVocabSource: () => undefined,
}));
vi.mock('@/features/learning', () => ({ useGameLogger: () => mocks.log }));
vi.mock('../../hooks/useGameAudio', () => ({
  useGameAudio: () => ({
    playAudio: mocks.audio,
    playFeedbackSound: vi.fn(),
    playCorrectSequence: mocks.correct,
    praiseVisible: false,
  }),
}));
vi.mock('../../hooks/useGameEntryGuide', () => ({ useGameEntryGuide: () => undefined }));
vi.mock('../../hooks/usePhonicsMap', () => ({
  usePhonicsMap: () => ({ mapRef: mocks.map, loading: false }),
}));
vi.mock('../../hooks/useBoardCamera', () => ({
  useBoardCamera: (options: unknown) => {
    mocks.camera(options);
    return { word: '' };
  },
}));
vi.mock('../../hooks/useIsLandscape', () => ({ useIsLandscape: () => true }));
vi.mock('@/features/storybook', () => ({
  useStorybook: () => ({ data: undefined }),
  storybookApi: { getById: vi.fn(async () => undefined) },
}));
vi.mock('@/features/tts', () => ({ resolveTtsUrl: mocks.resolve }));
vi.mock('../GameStyleChip', () => ({ useGameStyle: () => ({ selectedStyle: undefined }) }));
vi.mock('./EnglishBlockTutorial/EnglishBlockTutorial.context', () => ({
  TutorialProvider: ({ children }: { children: ReactNode }) => children,
  useTutorialIsPlaying: () => false,
  useTutorialHighlight: () => ({ popLetter: null, glowSlot: null }),
  useTutorialExpected: () => null,
  useTutorialNotify: () => mocks.notify,
}));

function start() {
  return render(
    <EnglishBlockPlayer
      storybookId="en-b2-u01"
      initialInputMode="screen"
      difficulty="easy"
      onBack={vi.fn()}
      onComplete={vi.fn()}
      gameData={{
        type: 'english-block',
        items: ['cat', 'dog'].map((word) => ({
          word,
          letters: word.split('').map((char) => ({ char })),
        })),
      }}
    />
  );
}
describe('EnglishBlockPlayer unified controls', () => {
  beforeEach(() => vi.clearAllMocks());
  it('keeps restricted unit letters and the sound question for legacy alphabet rounds', () => {
    render(
      <EnglishBlockPlayer
        storybookId="legacy-alphabet"
        initialInputMode="screen"
        difficulty="easy"
        onBack={vi.fn()}
        onComplete={vi.fn()}
        gameData={{
          type: 'english-block',
          panelLetters: ['a', 'b', 'c'],
          items: [{ word: 'c', letters: [{ char: 'c' }], ttsUrl: '/cat.mp3' }],
        }}
      />
    );
    expect(screen.queryByRole('heading', { name: 'c' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'a' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'd' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '다음 블록 보기' })).not.toBeInTheDocument();
  });
  it('cancels horizontal touch drag so alphabet swiping does not place a letter', () => {
    start();
    const tile = screen.getByRole('button', { name: 'a' });
    fireEvent.touchStart(tile, { touches: [{ identifier: 0, clientX: 100, clientY: 100 }] });
    fireEvent.touchMove(tile, { touches: [{ identifier: 0, clientX: 60, clientY: 101 }] });
    fireEvent.touchEnd(tile, {
      touches: [],
      changedTouches: [{ identifier: 0, clientX: 60, clientY: 101 }],
    });
    expect(screen.getByRole('button', { name: '1번째 글자 칸' })).toBeEmptyDOMElement();
    expect(screen.getByRole('button', { name: '되돌리기' })).toBeDisabled();
    fireEvent.click(tile);
    expect(screen.getByRole('button', { name: '1번째 글자 칸' })).toHaveTextContent('a');
  });
  it('can undo a placement and a reset, then clears undo history on the next word', () => {
    start();
    fireEvent.click(screen.getByRole('button', { name: 'c' }));
    expect(screen.getByRole('button', { name: '1번째 글자 칸' })).toHaveTextContent('c');
    fireEvent.click(screen.getByRole('button', { name: '되돌리기' }));
    expect(screen.getByRole('button', { name: '1번째 글자 칸' })).toBeEmptyDOMElement();
    expect(screen.getByRole('button', { name: '되돌리기' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'a' }));
    fireEvent.click(screen.getByRole('button', { name: '초기화' }));
    fireEvent.click(screen.getByRole('button', { name: '되돌리기' }));
    expect(screen.getByRole('button', { name: '1번째 글자 칸' })).toHaveTextContent('a');
    fireEvent.click(screen.getByRole('button', { name: '다음 →' }));
    expect(screen.getByRole('heading', { name: 'dog' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '되돌리기' })).toBeDisabled();
  });
  it('reads the placed letters without judging a partial answer, and keeps automatic success', async () => {
    start();
    fireEvent.click(screen.getByRole('button', { name: 'c' }));
    fireEvent.click(screen.getByRole('button', { name: '확인' }));
    await waitFor(() => expect(mocks.audio).toHaveBeenCalledWith('/word.mp3'));
    expect(mocks.resolve).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'c', language: 'english' })
    );
    expect(mocks.log).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'a' }));
    fireEvent.click(screen.getByRole('button', { name: 't' }));
    await waitFor(() => expect(mocks.correct).toHaveBeenCalled());
    expect(mocks.log).toHaveBeenCalledWith(
      expect.objectContaining({
        gameType: 'english-block',
        results: expect.arrayContaining([expect.objectContaining({ word: 'cat', correct: true })]),
      })
    );
    expect(screen.getByRole('button', { name: '확인' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: '실물 블록' })).not.toBeInTheDocument();
    expect(mocks.camera).toHaveBeenCalledWith({ set: 'en', enabled: false });
  });
});

it('listening blocks hide the answer and image, require hearing and submission, and report hints once without duplicate game logs', async () => {
  vi.clearAllMocks();
  const attempt = vi.fn();
  render(
    <EnglishBlockPlayer
      storybookId="en-b2-u01"
      initialInputMode="screen"
      difficulty="easy"
      onBack={vi.fn()}
      onComplete={vi.fn()}
      listeningPractice
      onPracticeAttempt={attempt}
      gameData={{
        type: 'english-block',
        items: [
          {
            word: 'cat',
            ttsUrl: '/cat.mp3',
            imageUrl: '/cat.png',
            letters: [{ char: 'c' }, { char: 'a' }, { char: 't' }],
          },
        ],
      }}
    />
  );
  expect(screen.queryByRole('heading', { name: 'cat' })).not.toBeInTheDocument();
  expect(screen.queryByAltText('cat')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: '결과 보기' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: '소리 듣기' }));
  await waitFor(() =>
    expect(mocks.audio).toHaveBeenCalledWith('/cat.mp3', expect.any(Function), expect.any(Function))
  );
  const call = mocks.audio.mock.calls.find((c) => c[0] === '/cat.mp3')!;
  fireEvent.click(screen.getByRole('button', { name: '힌트' }));
  expect(screen.getByRole('status', { name: '첫 글자' })).toHaveTextContent('c…');
  act(() => call[1]());
  fireEvent.click(screen.getByRole('button', { name: 'c' }));
  fireEvent.click(screen.getByRole('button', { name: 'a' }));
  fireEvent.click(screen.getByRole('button', { name: 't' }));
  expect(attempt).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: '확인' }));
  expect(attempt).toHaveBeenCalledExactlyOnceWith(true, 'cat', {
    question: 0,
    firstAttempt: true,
    hintUsed: true,
  });
  expect(mocks.log).not.toHaveBeenCalled();
});

it('connected practice waits for the real correct sequence and returns to the owner without a skip/result button', async () => {
  vi.clearAllMocks();
  const complete = vi.fn();
  render(
    <EnglishBlockPlayer
      storybookId="en-b2-u01"
      difficulty="easy"
      initialInputMode="screen"
      onBack={vi.fn()}
      connectedPractice
      onComplete={complete}
      gameData={{
        type: 'english-block',
        items: [{ word: 'cat', letters: [{ char: 'c' }, { char: 'a' }, { char: 't' }] }],
      }}
    />
  );
  expect(screen.queryByRole('button', { name: '결과 보기' })).toBeNull();
  for (const char of ['c', 'a', 't']) fireEvent.click(screen.getByRole('button', { name: char }));
  await waitFor(() => expect(mocks.correct).toHaveBeenCalled());
  expect(complete).not.toHaveBeenCalled();
  act(() => mocks.correct.mock.calls.at(-1)![0].onDone());
  expect(complete).toHaveBeenCalledExactlyOnceWith(1, 1);
});
