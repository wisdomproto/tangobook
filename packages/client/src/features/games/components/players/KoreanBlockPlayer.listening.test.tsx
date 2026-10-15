import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { expect, it, vi } from 'vitest';
import { KoreanBlockPlayer } from './KoreanBlockPlayer';

const mocks = vi.hoisted(() => ({
  log: vi.fn(),
  audio: vi.fn(),
  correct: vi.fn(),
  camera: vi.fn(),
  resolve: vi.fn(async () => '/word.mp3'),
  notify: vi.fn(),
  composed: [] as string[],
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

vi.mock('../../lib/tango-board/compose', () => ({ parseBoard: () => mocks.composed }));
vi.mock('./TangoBoard', () => ({
  toItems: (p: unknown[]) => p,
  canPlace: () => true,
  findNearestPlacement: () => null,
  TangoBoard: ({
    onPlace,
  }: {
    onPlace: (x: number, y: number, id: number, rot: number) => void;
  }) => <button onClick={() => onPlace(0, 0, 1, 0)}>배치</button>,
}));
it('Korean listening blocks hide answer images, judge only submitted attempts, and retain a failed first try before hinted correction', async () => {
  vi.clearAllMocks();
  mocks.composed = [];
  const attempt = vi.fn();
  render(
    <KoreanBlockPlayer
      storybookId="kr-h1-u02"
      initialInputMode="screen"
      difficulty="easy"
      onBack={vi.fn()}
      onComplete={vi.fn()}
      listeningPractice
      onPracticeAttempt={attempt}
      gameData={{
        type: 'korean-block',
        items: [{ word: '가', ttsUrl: '/ga.mp3', imageUrl: '/ga.png' }],
      }}
    />
  );
  expect(screen.queryByRole('heading', { name: '가' })).not.toBeInTheDocument();
  expect(screen.queryByAltText('가')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '소리 듣기' }));
  await waitFor(() =>
    expect(mocks.audio).toHaveBeenCalledWith('/ga.mp3', expect.any(Function), expect.any(Function))
  );
  act(() => mocks.audio.mock.calls.find((c) => c[0] === '/ga.mp3')![1]());
  mocks.composed = ['나'];
  fireEvent.click(screen.getByRole('button', { name: '배치' }));
  fireEvent.click(screen.getByRole('button', { name: '확인' }));
  expect(attempt).toHaveBeenLastCalledWith(false, '가', {
    question: 0,
    firstAttempt: true,
    hintUsed: false,
  });
  fireEvent.click(screen.getByRole('button', { name: '힌트' }));
  mocks.composed = ['가'];
  fireEvent.click(screen.getByRole('button', { name: '배치' }));
  expect(attempt).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: '확인' }));
  expect(attempt).toHaveBeenLastCalledWith(true, '가', {
    question: 0,
    firstAttempt: false,
    hintUsed: true,
  });
  expect(mocks.log).not.toHaveBeenCalled();
});

it('connected practice waits for the real correct sequence and returns to the owner without a skip/result button', async () => {
  vi.clearAllMocks();
  mocks.composed = [];
  const complete = vi.fn();
  render(
    <KoreanBlockPlayer
      storybookId="kr-h1-u02"
      difficulty="easy"
      initialInputMode="screen"
      onBack={vi.fn()}
      connectedPractice
      onComplete={complete}
      gameData={{
        type: 'korean-block',
        items: [
          {
            word: '가',
            imageUrl: '',
            syllables: [{ char: '가', cho: 'ㄱ', jung: 'ㅏ', jong: null }],
          },
        ],
      }}
    />
  );
  expect(screen.queryByRole('button', { name: '결과 보기' })).toBeNull();
  mocks.composed = ['가'];
  fireEvent.click(screen.getByRole('button', { name: '배치' }));
  await waitFor(() => expect(mocks.correct).toHaveBeenCalled());
  expect(complete).not.toHaveBeenCalled();
  act(() => mocks.correct.mock.calls.at(-1)![0].onDone());
  expect(complete).toHaveBeenCalledExactlyOnceWith(1, 1);
});
