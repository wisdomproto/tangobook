import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import type { Storybook } from '@tangobook/shared';
import type { ReactNode } from 'react';
import { WordMeetingActivity, wordMeetingSceneMatches } from './WordMeetingActivity';
const { audio, timers, lookup, stopAll, resolve, getWord } = vi.hoisted(() => ({
  resolve: vi.fn(async () => '/word.mp3'),
  getWord: vi.fn(async () => '/word.mp3'),
  stopAll: vi.fn(),
  audio: vi.fn(),
  timers: [] as (() => void)[],
  lookup: vi.fn(async (text: string) => `/${text}.mp3`),
}));
vi.mock('../components/ActivityShell', () => ({
  ActivityShell: ({ children }: { children: ReactNode }) => children,
}));
vi.mock('@/features/games/hooks/useGameAudio', () => ({
  useGameAudio: () => ({
    playAudio: audio,
    scheduleTimer: (fn: () => void) => timers.push(fn),
    stopAll,
  }),
}));
vi.mock('@/features/games/hooks/usePhonicsMap', () => ({
  getEnglishPhonemeUrl: lookup,
  getKoreanSyllableUrl: lookup,
  getEnglishWordUrl: getWord,
}));
vi.mock('@/features/tts', () => ({ resolveTtsUrl: resolve }));
vi.mock('@/features/games/lib/phonics-word-scene', () => ({ preloadWordScenes: async () => {} }));
vi.mock('@/features/games/lib/resolve-scene', () => ({ resolveSceneFromWord: () => null }));
vi.mock('@/features/games/effects/learning-effects', () => ({
  emitLearningEffect: vi.fn(),
  prepareLearningEffects: vi.fn(),
}));
beforeEach(() => {
  audio.mockClear();
  lookup.mockClear();
  resolve.mockClear();
  getWord.mockClear();
  timers.length = 0;
});
it('never auto-blends; each press produces a rime/word and waits for another child press', async () => {
  const complete = vi.fn();
  render(
    <WordMeetingActivity
      unitId="en-b2-u01"
      lang="english"
      book={{ id: 'en-b2-u01' } as Storybook}
      word="cat"
      ttsUrl="/authored-c-a-t.mp3"
      onComplete={complete}
      onBack={vi.fn()}
    />
  );
  await waitFor(() => expect(lookup).toHaveBeenCalledWith('at'));
  expect(audio).not.toHaveBeenCalled();
  expect(getWord).toHaveBeenCalledWith('cat');
  expect(resolve).not.toHaveBeenCalled();
  await waitFor(() => expect(screen.getByRole('button', { name: '소리 합치기' })).toBeEnabled());
  fireEvent.click(screen.getByRole('button', { name: '소리 합치기' }));
  await waitFor(() =>
    expect(audio).toHaveBeenLastCalledWith('/a.mp3', expect.any(Function), expect.any(Function))
  );
  act(() => audio.mock.calls.at(-1)![1]());
  expect(audio).toHaveBeenLastCalledWith('/t.mp3', expect.any(Function), expect.any(Function));
  act(() => audio.mock.calls.at(-1)![1]());
  act(() => timers.shift()!());
  expect(audio).toHaveBeenLastCalledWith('/at.mp3', expect.any(Function), expect.any(Function));
  act(() => audio.mock.calls.at(-1)![1]());
  act(() => timers.shift()!());
  expect(audio).toHaveBeenCalledTimes(3);
  expect(complete).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: '소리 합치기' }));
  await waitFor(() =>
    expect(audio).toHaveBeenLastCalledWith('/c.mp3', expect.any(Function), expect.any(Function))
  );
  act(() => audio.mock.calls.at(-1)![1]());
  expect(audio).toHaveBeenLastCalledWith('/at.mp3', expect.any(Function), expect.any(Function));
  act(() => audio.mock.calls.at(-1)![1]());
  act(() => timers.shift()!());
  expect(audio).toHaveBeenLastCalledWith('/word.mp3', expect.any(Function), expect.any(Function));
  act(() => audio.mock.calls.at(-1)![1]());
  expect(complete).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: '다음으로' }));
  expect(complete).toHaveBeenCalledTimes(1);
});
it('failed playback offers retry and cannot complete or advance the word', async () => {
  const complete = vi.fn();
  render(
    <WordMeetingActivity
      unitId="kr-h1-u02"
      lang="korean"
      book={{ id: 'kr-h1-u02' } as Storybook}
      word="가"
      onComplete={complete}
      onBack={vi.fn()}
    />
  );
  await waitFor(() => expect(screen.getByRole('button', { name: '소리 합치기' })).toBeEnabled());
  fireEvent.click(screen.getByRole('button', { name: '소리 합치기' }));
  await waitFor(() => expect(timers.length).toBe(1));
  act(() => timers.shift()!());
  act(() => audio.mock.calls.at(-1)![2]());
  expect(screen.getByRole('alert')).toBeDefined();
  expect(complete).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: '소리 합치기' })).toBeEnabled();
});
it('a failed English part sound does not skip ahead or complete', async () => {
  const complete = vi.fn();
  render(
    <WordMeetingActivity
      unitId="en-b2-u01"
      lang="english"
      book={{ id: 'en-b2-u01' } as Storybook}
      word="cat"
      onComplete={complete}
      onBack={vi.fn()}
    />
  );
  await waitFor(() => expect(screen.getByRole('button', { name: '소리 합치기' })).toBeEnabled());
  fireEvent.click(screen.getByRole('button', { name: '소리 합치기' }));
  await waitFor(() => expect(audio).toHaveBeenCalled());
  act(() => audio.mock.calls.at(-1)![2]());
  expect(screen.getByRole('alert')).toBeDefined();
  expect(complete).not.toHaveBeenCalled();
  expect(timers).toHaveLength(0);
  expect(screen.getByRole('button', { name: '소리 합치기' })).toBeEnabled();
});

it.each(['dragon', 'elephant', 'whisper'])(
  'keeps %s whole and never invents component sounds',
  async (word) => {
    const complete = vi.fn();
    render(
      <WordMeetingActivity
        unitId="en-b4-u04"
        lang="english"
        book={{ id: 'en-b4-u04' } as Storybook}
        word={word}
        onComplete={complete}
        onBack={vi.fn()}
      />
    );
    await waitFor(() => expect(screen.getByRole('button', { name: '낱말 듣기' })).toBeEnabled());
    expect(lookup).not.toHaveBeenCalled();
    expect(getWord).toHaveBeenCalledWith(word);
    fireEvent.click(screen.getByRole('button', { name: '낱말 듣기' }));
    await waitFor(() => expect(timers).toHaveLength(1));
    act(() => timers.shift()!());
    expect(audio).toHaveBeenLastCalledWith('/word.mp3', expect.any(Function), expect.any(Function));
    act(() => audio.mock.calls.at(-1)![1]());
    expect(complete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '다음으로' }));
    expect(complete).toHaveBeenCalledOnce();
  }
);

it('does not introduce an unrelated compound meaning through a story excerpt', () => {
  expect(wordMeetingSceneMatches('He was a scaredy-cat.', 'cat', 'english')).toBe(false);
  expect(wordMeetingSceneMatches('A cat sat on a mat.', 'cat', 'english')).toBe(true);
  expect(wordMeetingSceneMatches('The caterpillar ate a leaf.', 'cat', 'english')).toBe(false);
  expect(wordMeetingSceneMatches('고기가 있어요.', '고기', 'korean')).toBe(true);
});

it('keeps the full Korean word in place while moving focus after the actual syllable sound ends', async () => {
  const { container } = render(
    <WordMeetingActivity
      unitId="kr-h1-u02"
      lang="korean"
      book={{ id: 'kr-h1-u02' } as Storybook}
      word="아기"
      imageUrl="/baby.webp"
      onComplete={vi.fn()}
      onBack={vi.fn()}
    />
  );
  await waitFor(() => expect(screen.getByRole('button', { name: '소리 합치기' })).toBeEnabled());
  const heading = screen.getByRole('heading', { name: '아기' });
  expect(container.querySelector('[aria-current="step"]')).toHaveAttribute('data-syllable', '0');
  fireEvent.click(screen.getByRole('button', { name: '소리 합치기' }));
  await waitFor(() => expect(timers).toHaveLength(1));
  act(() => timers.shift()!());
  expect(audio).toHaveBeenLastCalledWith('/아.mp3', expect.any(Function), expect.any(Function));
  expect(container.querySelector('[aria-current="step"]')).toHaveAttribute('data-syllable', '0');
  act(() => audio.mock.calls.at(-1)![1]());
  act(() => timers.shift()!());
  expect(screen.getByRole('heading', { name: '아기' })).toBe(heading);
  expect(container.querySelector('[aria-current="step"]')).toHaveAttribute('data-syllable', '1');
  expect(container.querySelector('.word-meet-parts')).toBeNull();
  expect(container.querySelector('.word-meet-history')).toBeNull();
  expect(container.querySelectorAll('.word-meet-glyph')).toHaveLength(2);
});

it('reads the highlighted coda syllable as a whole instead of pronouncing a different CV', async () => {
  const { container } = render(
    <WordMeetingActivity
      unitId="kr-h2-u01"
      lang="korean"
      book={{ id: 'kr-h2-u01' } as Storybook}
      word="강아지"
      onComplete={vi.fn()}
      onBack={vi.fn()}
    />
  );
  await waitFor(() => expect(screen.getByRole('button', { name: '소리 합치기' })).toBeEnabled());
  fireEvent.click(screen.getByRole('button', { name: '소리 합치기' }));
  await waitFor(() => expect(timers).toHaveLength(1));
  act(() => timers.shift()!());
  expect(audio).toHaveBeenLastCalledWith('/강.mp3', expect.any(Function), expect.any(Function));
  expect(container.querySelector('[aria-current="step"]')).toHaveAttribute('data-syllable', '0');
  expect(screen.getByRole('heading', { name: '강아지' })).toBeInTheDocument();
});
