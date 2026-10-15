import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import type { Storybook } from '@tangobook/shared';
import type { ReactNode } from 'react';
import { WordMeetingActivity, wordMeetingSceneMatches } from './WordMeetingActivity';
const { audio, timers, lookup, stopAll, resolve, getWord, findScene } = vi.hoisted(() => ({
  resolve: vi.fn(async () => '/word.mp3'),
  findScene: vi.fn(() => null as unknown),
  getWord: vi.fn(async () => '/word.mp3'),
  stopAll: vi.fn(),
  audio: vi.fn(),
  timers: [] as (() => void)[],
  lookup: vi.fn(async (text: string) => `/${text}.mp3`),
}));
vi.mock('../components/ActivityShell', () => ({
  ActivityShell: ({ children }: { children: ReactNode }) => children,
  usePhonicsEmbedded: () => false,
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
vi.mock('@/features/games/lib/resolve-scene', () => ({ resolveSceneFromWord: findScene }));
vi.mock('@/features/games/components/SceneReveal', () => ({
  SceneReveal: ({ text, onDone }: { text: string; onDone: () => void }) => (
    <button onClick={onDone}>scene {text}</button>
  ),
}));
vi.mock('@/features/games/effects/learning-effects', () => ({
  emitLearningEffect: vi.fn(),
  prepareLearningEffects: vi.fn(),
}));
beforeEach(() => {
  audio.mockClear();
  findScene.mockReturnValue(null);
  lookup.mockClear();
  resolve.mockClear();
  getWord.mockClear();
  timers.length = 0;
});
async function finishKoreanIntro() {
  await waitFor(() =>
    expect(audio).toHaveBeenCalledWith('/word.mp3', expect.any(Function), expect.any(Function))
  );
  for (let i = 0; i < 3; i++) {
    const call = audio.mock.calls.at(-1)!;
    act(() => call[1]());
    if (String(call[0]).startsWith('/sounds/voice/')) break;
  }
  await waitFor(() => expect(screen.getByRole('button', { name: '합쳐보기' })).toBeEnabled());
}

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
  await finishKoreanIntro();
  fireEvent.click(screen.getByRole('button', { name: '합쳐보기' }));
  await waitFor(() => expect(timers.length).toBe(1));
  act(() => timers.shift()!());
  act(() => audio.mock.calls.at(-1)![2]());
  expect(screen.getByRole('alert')).toBeDefined();
  expect(complete).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: '합쳐보기' })).toBeEnabled();
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
  await finishKoreanIntro();
  const heading = screen.getByRole('heading', { name: '아기' });
  expect(screen.getByRole('group', { name: 'ㅇ + ㅏ → 아' })).toBeInTheDocument();
  expect(container.querySelector('[aria-current="step"]')).toHaveAttribute('data-syllable', '0');
  fireEvent.click(screen.getByRole('button', { name: '합쳐보기' }));
  await waitFor(() => expect(timers).toHaveLength(1));
  act(() => timers.shift()!());
  expect(audio).toHaveBeenLastCalledWith('/아.mp3', expect.any(Function), expect.any(Function));
  expect(container.querySelector('.word-meet-jamo-result')).toHaveTextContent('아');
  expect(container.querySelector('[aria-current="step"]')).toHaveAttribute('data-syllable', '0');
  act(() => audio.mock.calls.at(-1)![1]());
  act(() => timers.shift()!());
  expect(screen.getByRole('heading', { name: '아기' })).toBe(heading);
  expect(container.querySelector('[aria-current="step"]')).toHaveAttribute('data-syllable', '1');
  expect(screen.getByRole('group', { name: 'ㄱ + ㅣ → 기' })).toBeInTheDocument();
  expect(screen.queryByRole('group', { name: 'ㅇ + ㅏ → 아' })).not.toBeInTheDocument();
  expect(container.querySelector('.word-meet-jamo-result')).toHaveTextContent('기');
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
  await finishKoreanIntro();
  fireEvent.click(screen.getByRole('button', { name: '합쳐보기' }));
  await waitFor(() => expect(timers).toHaveLength(1));
  act(() => timers.shift()!());
  expect(audio).toHaveBeenLastCalledWith('/강.mp3', expect.any(Function), expect.any(Function));
  expect(screen.getByRole('group', { name: '가 + ㅇ → 강' })).toBeInTheDocument();
  expect(container.querySelector('[aria-current="step"]')).toHaveAttribute('data-syllable', '0');
  expect(screen.getByRole('heading', { name: '강아지' })).toBeInTheDocument();
});

it('introduces the whole word before showing jamo and never automatically blends', async () => {
  const complete = vi.fn();
  const { container } = render(
    <WordMeetingActivity
      unitId="kr-h1-u02"
      lang="korean"
      book={{ id: 'kr-h1-u02' } as Storybook}
      word="아기"
      onComplete={complete}
      onBack={vi.fn()}
    />
  );
  const word = screen.getByRole('heading', { name: '아기' });
  expect(screen.queryByRole('group', { name: 'ㅇ + ㅏ → 아' })).not.toBeInTheDocument();
  expect(container.querySelector('[aria-current="step"]')).toBeNull();
  await finishKoreanIntro();
  expect(screen.getByRole('heading', { name: '아기' })).toBe(word);
  expect(screen.getByRole('group', { name: 'ㅇ + ㅏ → 아' })).toBeInTheDocument();
  expect(container.querySelector('[aria-current="step"]')).toHaveAttribute('data-syllable', '0');
  expect(timers).toHaveLength(0);
  expect(complete).not.toHaveBeenCalled();
});

it('retries a blocked introduction on the same button and lets a child interrupt the action guide', async () => {
  const complete = vi.fn();
  const { container } = render(
    <WordMeetingActivity
      unitId="kr-h1-u02"
      lang="korean"
      book={{ id: 'kr-h1-u02' } as Storybook}
      word="아기"
      onComplete={complete}
      onBack={vi.fn()}
    />
  );
  await waitFor(() =>
    expect(audio).toHaveBeenCalledWith('/word.mp3', expect.any(Function), expect.any(Function))
  );
  act(() => audio.mock.calls.at(-1)![2]());
  expect(screen.getByRole('button', { name: '낱말 듣기' })).toBeEnabled();
  expect(screen.queryByRole('group', { name: 'ㅇ + ㅏ → 아' })).not.toBeInTheDocument();
  expect(timers).toHaveLength(0);
  fireEvent.click(screen.getByRole('button', { name: '낱말 듣기' }));
  await waitFor(() => expect(audio).toHaveBeenCalledTimes(2));
  act(() => audio.mock.calls.at(-1)![1]());
  expect(screen.getByRole('group', { name: 'ㅇ + ㅏ → 아' })).toBeInTheDocument();
  const oldFocusEnded = audio.mock.calls.at(-1)![1];
  fireEvent.click(screen.getByRole('button', { name: '합쳐보기' }));
  await waitFor(() => expect(timers).toHaveLength(1));
  const count = audio.mock.calls.length;
  act(() => oldFocusEnded());
  expect(audio).toHaveBeenCalledTimes(count);
  expect(container.querySelector('[aria-current="step"]')).toHaveAttribute('data-syllable', '0');
  expect(complete).not.toHaveBeenCalled();
});

it('cancels a pending introduction when leaving instead of starting the guide on another screen', async () => {
  const view = render(
    <WordMeetingActivity
      unitId="kr-h1-u02"
      lang="korean"
      book={{ id: 'kr-h1-u02' } as Storybook}
      word="아기"
      onComplete={vi.fn()}
      onBack={vi.fn()}
    />
  );
  await waitFor(() =>
    expect(audio).toHaveBeenCalledWith('/word.mp3', expect.any(Function), expect.any(Function))
  );
  const oldEnded = audio.mock.calls.at(-1)![1];
  const count = audio.mock.calls.length;
  view.unmount();
  act(() => oldEnded());
  expect(audio).toHaveBeenCalledTimes(count);
  expect(stopAll).toHaveBeenCalled();
});

it('keeps the taught meaning when entering a story and completes only after that scene', async () => {
  const complete = vi.fn();
  findScene.mockReturnValue({
    illustrationUrl: '/snake.webp',
    pageText: '둥지 안 아기 까치들은 떨었어요.',
    pageTtsUrl: '/bird.mp3',
    pageNumber: 1,
  });
  const book = {
    id: 'kr-h1-u02',
    type: 'phonics',
    pages: [
      { text: '아기 새가 자요.', illustrationUrl: '/bird.webp', ttsUrl: '/bird.mp3' },
      {
        text: '이번엔 아기! 그림과 단어를 맞췄어요.',
        illustrationUrl: '/baby-scene.webp',
        ttsUrl: '/baby-scene.mp3',
      },
    ],
  } as Storybook;
  render(
    <WordMeetingActivity
      unitId="kr-h1-u02"
      lang="korean"
      book={book}
      word="아기"
      onComplete={complete}
      onBack={vi.fn()}
    />
  );
  await finishKoreanIntro();
  for (let step = 0; step < 3; step++) {
    fireEvent.click(screen.getByRole('button', { name: step < 2 ? '합쳐보기' : '낱말 듣기' }));
    await waitFor(() => expect(timers).toHaveLength(1));
    act(() => timers.shift()!());
    act(() => audio.mock.calls.at(-1)![1]());
    if (step < 2) act(() => timers.shift()!());
  }
  fireEvent.click(screen.getByRole('button', { name: '다음으로' }));
  expect(
    screen.getByRole('button', { name: 'scene 이번엔 아기! 그림과 단어를 맞췄어요.' })
  ).toBeInTheDocument();
  expect(screen.queryByText(/까치들은/)).not.toBeInTheDocument();
  expect(complete).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: /scene 이번엔/ }));
  expect(complete).toHaveBeenCalledOnce();
});

it('does not substitute a baby animal context for the illustrated human baby', () => {
  expect(wordMeetingSceneMatches('둥지 안 아기 까치가 울었어요.', '아기', 'korean')).toBe(false);
  expect(wordMeetingSceneMatches('아기 새가 잠들었어요.', '아기', 'korean')).toBe(false);
  expect(wordMeetingSceneMatches('엄마가 아기를 안았어요.', '아기', 'korean')).toBe(true);
});
