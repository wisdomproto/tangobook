import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { KoreanWordWritingPlayer } from './KoreanWordWritingPlayer';
import { EnglishWordWritingPlayer } from './EnglishWordWritingPlayer';

const mocks = vi.hoisted(() => ({ audio: vi.fn(), correct: vi.fn(), scene: vi.fn() }));
vi.mock('../GamePlayerLayout', () => ({
  GamePlayerLayout: ({ children }: { children: ReactNode }) => children,
}));
vi.mock('../GameHeader', () => ({ GameHeader: () => null }));
vi.mock('../FeedbackOverlay', () => ({ FeedbackOverlay: () => null }));
vi.mock('../GameStyleChip', () => ({ useGameStyle: () => ({ selectedStyle: undefined }) }));
vi.mock('../../hooks/useGameEntryGuide', () => ({ useGameEntryGuide: () => undefined }));
vi.mock('../../hooks/useGameAudio', () => ({
  useGameAudio: () => ({
    playAudio: mocks.audio,
    playCorrectSequence: mocks.correct,
    praiseVisible: false,
  }),
}));
vi.mock('../../lib/resolve-scene', () => ({ resolveSceneFromWord: mocks.scene }));
vi.mock('@/features/storybook', () => ({ useStorybook: () => ({ data: undefined }) }));
vi.mock('@/features/learning', () => ({ useGameLogger: () => vi.fn() }));
vi.mock('@/features/tts', () => ({ resolveTtsUrl: async () => '/word.mp3' }));
vi.mock('@/features/phonics/components/WordFillCanvas', () => ({
  WordFillCanvas: ({ word, onComplete }: { word: string; onComplete: () => void }) => (
    <button onClick={onComplete}>trace {word}</button>
  ),
}));
beforeEach(() => vi.clearAllMocks());

it.each([
  [KoreanWordWritingPlayer, 'kr-h1-u02', '가', 'korean-word-writing'],
  [EnglishWordWritingPlayer, 'en-b2-u01', 'cat', 'english-word-writing'],
] as const)(
  'connected writing returns only after the word and praise finish',
  async (Player, id, word, type) => {
    const complete = vi.fn();
    render(
      <Player
        storybookId={id}
        difficulty="easy"
        onBack={vi.fn()}
        onComplete={complete}
        connectedPractice
        gameData={{ type, items: [{ word, referenceImageUrl: '' }] }}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: `trace ${word}` }));
    await waitFor(() =>
      expect(mocks.audio).toHaveBeenCalledWith('/word.mp3', expect.any(Function))
    );
    expect(complete).not.toHaveBeenCalled();
    act(() => mocks.audio.mock.calls.at(-1)![1]());
    expect(complete).not.toHaveBeenCalled();
    act(() => mocks.correct.mock.calls.at(-1)![0].onDone());
    expect(complete).toHaveBeenCalledExactlyOnceWith(100, 100);
    expect(mocks.scene).not.toHaveBeenCalled();
  }
);
