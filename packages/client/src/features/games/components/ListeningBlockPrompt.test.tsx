import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { ListeningBlockPrompt, useListeningBlockPrompt } from './ListeningBlockPrompt';
const mocks = vi.hoisted(() => ({ resolve: vi.fn() }));
vi.mock('@/features/tts', () => ({ resolveTtsUrl: mocks.resolve }));
beforeEach(() => vi.clearAllMocks());
const options = {
  enabled: true,
  word: '나비',
  question: 0,
  language: 'korean' as const,
  storybookId: 'u',
};
it('requires successful playback, exposes only the first character hint, and resets even for a repeated word', async () => {
  const audio = vi.fn();
  const { result, rerender } = renderHook(
    ({ question }) =>
      useListeningBlockPrompt({ ...options, question, ttsUrl: '/word.mp3', playAudio: audio }),
    { initialProps: { question: 0 } }
  );
  await act(async () => {
    await result.current.listen();
  });
  expect(result.current.heard).toBe(false);
  act(() => audio.mock.calls[0][1]());
  expect(result.current.heard).toBe(true);
  act(() => result.current.revealHint());
  render(<ListeningBlockPrompt prompt={result.current} />);
  expect(screen.getByRole('status')).toHaveTextContent('나…');
  expect(screen.queryByText('나비')).not.toBeInTheDocument();
  expect(mocks.resolve).not.toHaveBeenCalled();
  rerender({ question: 1 });
  expect(result.current.heard).toBe(false);
  expect(result.current.hintUsed).toBe(false);
});
it('does not grant listening evidence on missing audio or playback failure', async () => {
  mocks.resolve.mockResolvedValue(undefined);
  const audio = vi.fn();
  const { result } = renderHook(() => useListeningBlockPrompt({ ...options, playAudio: audio }));
  await act(async () => {
    await result.current.listen();
  });
  expect(result.current.error).toBe(true);
  expect(result.current.heard).toBe(false);
  mocks.resolve.mockResolvedValue('/word.mp3');
  await act(async () => {
    await result.current.listen();
  });
  act(() => audio.mock.calls[0][2]());
  expect(result.current.error).toBe(true);
  expect(result.current.heard).toBe(false);
});
it('ignores an old resolution after moving to the next question', async () => {
  let resolveOld!: (url: string) => void;
  mocks.resolve.mockReturnValue(
    new Promise<string>((resolve) => {
      resolveOld = resolve;
    })
  );
  const audio = vi.fn();
  const { result, rerender } = renderHook(
    ({ question }) => useListeningBlockPrompt({ ...options, question, playAudio: audio }),
    { initialProps: { question: 0 } }
  );
  act(() => {
    void result.current.listen();
  });
  rerender({ question: 1 });
  await act(async () => {
    resolveOld('/old.mp3');
  });
  expect(audio).not.toHaveBeenCalled();
  expect(result.current.heard).toBe(false);
});
it('disables repeated playback clicks while loading and displays recoverable audio failure', async () => {
  const audio = vi.fn();
  mocks.resolve.mockResolvedValue(undefined);
  function Prompt() {
    const prompt = useListeningBlockPrompt({ ...options, playAudio: audio });
    return <ListeningBlockPrompt prompt={prompt} />;
  }
  render(<Prompt />);
  fireEvent.click(screen.getByRole('button', { name: '소리 듣기' }));
  await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  expect(screen.getByRole('button', { name: '소리 듣기' })).toBeEnabled();
});

it('full model is optional, remains assisted after hiding, and resets only for a new question', () => {
  let state!: ReturnType<typeof useListeningBlockPrompt>;
  function Prompt({ question = 0 }: { question?: number }) {
    state = useListeningBlockPrompt({ ...options, question, playAudio: vi.fn() });
    return <ListeningBlockPrompt prompt={state} allowModelHint />;
  }
  const view = render(<Prompt />);
  fireEvent.change(screen.getByRole('combobox', { name: '도움 정도' }), {
    target: { value: 'model' },
  });
  expect(screen.getByRole('status', { name: '정답' })).toHaveTextContent('나비');
  expect(state.hintUsed).toBe(true);
  expect(state.heard).toBe(false);
  fireEvent.change(screen.getByRole('combobox', { name: '도움 정도' }), {
    target: { value: 'listen' },
  });
  expect(screen.queryByRole('status', { name: '정답' })).toBeNull();
  expect(state.hintUsed).toBe(true);
  view.rerender(<Prompt question={1} />);
  expect(state.hintUsed).toBe(false);
  expect(state.modelVisible).toBe(false);
});

it('retains the selected help level for the next item but not the previous question evidence', () => {
  const { result, rerender } = renderHook(
    ({ question }) =>
      useListeningBlockPrompt({
        ...options,
        question,
        initialSupport: 'model',
        playAudio: vi.fn(),
      }),
    { initialProps: { question: 0 } }
  );
  expect(result.current.modelVisible).toBe(true);
  act(() => result.current.changeSupport('first'));
  rerender({ question: 1 });
  expect(result.current.support).toBe('first');
  expect(result.current.modelVisible).toBe(false);
  expect(result.current.hintVisible).toBe(true);
  expect(result.current.hintUsed).toBe(true);
});
