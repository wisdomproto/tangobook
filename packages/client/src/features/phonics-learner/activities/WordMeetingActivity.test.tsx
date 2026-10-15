import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import type { Storybook } from '@tangobook/shared';
import type { ReactNode } from 'react';
import { WordMeetingActivity, wordMeetingSceneMatches } from './WordMeetingActivity';
const { audio, timers, lookup, stopAll, resolve, getWord, findScene, scheduleTimer } = vi.hoisted(
  () => {
    const timers: (() => void)[] = [];
    return {
      resolve: vi.fn(async () => '/word.mp3'),
      findScene: vi.fn(() => null as unknown),
      getWord: vi.fn(async () => '/word.mp3'),
      stopAll: vi.fn(),
      audio: vi.fn(),
      timers,
      scheduleTimer: (fn: () => void) => timers.push(fn),
      lookup: vi.fn(async (text: string) => `/${text}.mp3`),
    };
  }
);
vi.mock('../components/ActivityShell', () => ({
  ActivityShell: ({ children, header }: { children: ReactNode; header: ReactNode }) => (
    <>
      {header}
      {children}
    </>
  ),
  usePhonicsEmbedded: () => false,
}));
vi.mock('@/features/games/components/GameHeader', () => ({
  GameHeader: ({ rightExtra }: { rightExtra: ReactNode }) => <header>{rightExtra}</header>,
}));
vi.mock('@/features/games/hooks/useGameAudio', () => ({
  useGameAudio: () => ({
    playAudio: audio,
    scheduleTimer,
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
async function startKoreanDemonstration() {
  await waitFor(() => expect(timers).toHaveLength(1));
  await act(async () => timers.shift()!());
  await waitFor(() => expect(timers).toHaveLength(1));
  act(() => timers.shift()!());
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

function renderBaby(onComplete = vi.fn(), book = { id: 'kr-h1-u02' } as Storybook) {
  return render(
    <WordMeetingActivity
      unitId="kr-h1-u02"
      lang="korean"
      book={book}
      word="아기"
      imageUrl="/baby.webp"
      onComplete={onComplete}
      onBack={vi.fn()}
    />
  );
}

it('shows the chapter words and highlights the current target before starting without intro audio', async () => {
  const { container } = render(
    <WordMeetingActivity
      unitId="kr-h1-u02"
      lang="korean"
      book={{ id: 'kr-h1-u02' } as Storybook}
      words={['아기', '고기', '구이']}
      word="아기"
      onComplete={vi.fn()}
      onBack={vi.fn()}
    />
  );
  expect(screen.getAllByRole('listitem')).toHaveLength(3);
  expect(container.querySelector('.word-meeting-target[aria-current="step"]')).toHaveTextContent(
    '아기'
  );
  expect(audio).not.toHaveBeenCalled();
  expect(timers).toHaveLength(0);
  fireEvent.click(screen.getByRole('button', { name: '아기 만나기' }));
  expect(screen.queryByRole('list')).not.toBeInTheDocument();
  expect(container.querySelectorAll('.ko-word-part')).toHaveLength(4);
  await startKoreanDemonstration();
  expect(audio).toHaveBeenLastCalledWith('/아.mp3', expect.any(Function), expect.any(Function));
});

it('restarts the current word without completing or letting the previous audio advance it', async () => {
  const complete = vi.fn();
  const { container } = renderBaby(complete);
  await startKoreanDemonstration();
  const oldEnded = audio.mock.calls.at(-1)![1];
  fireEvent.click(screen.getByRole('button', { name: '다시 해보기' }));
  expect(container.querySelectorAll('[data-made="true"]')).toHaveLength(0);
  act(() => oldEnded());
  expect(screen.getByRole('button', { name: 'ㄱ + ㅣ 합쳐보기' })).toBeDisabled();
  await startKoreanDemonstration();
  expect(audio).toHaveBeenLastCalledWith('/아.mp3', expect.any(Function), expect.any(Function));
  expect(complete).not.toHaveBeenCalled();
});

it('starts with four jamo in one row, demonstrates only the first pair, and waits for actual audio', async () => {
  const { container } = renderBaby();
  expect(screen.queryByRole('heading', { name: '아기' })).not.toBeInTheDocument();
  expect(container.querySelectorAll('.ko-word-part')).toHaveLength(4);
  expect(screen.getByRole('button', { name: 'ㄱ + ㅣ 합쳐보기' })).toBeDisabled();
  expect(audio).not.toHaveBeenCalled();
  await startKoreanDemonstration();
  expect(audio).toHaveBeenLastCalledWith('/아.mp3', expect.any(Function), expect.any(Function));
  expect(audio.mock.calls.some((call) => call[0] === '/word.mp3')).toBe(false);
  expect(screen.getByRole('button', { name: 'ㄱ + ㅣ 합쳐보기' })).toBeDisabled();
  expect(container.querySelectorAll('[data-made="true"]')).toHaveLength(1);
  act(() => audio.mock.calls.at(-1)![1]());
  expect(screen.getByRole('button', { name: 'ㄱ + ㅣ 합쳐보기' })).toBeEnabled();
  expect(timers).toHaveLength(0); // The next pair requires the child's own press.
});

it('keeps formed syllables in the same row and reads the whole word only after both are formed', async () => {
  const complete = vi.fn();
  const { container } = renderBaby(complete);
  const row = screen.getByRole('group', { name: '낱말 만나기' });
  await startKoreanDemonstration();
  act(() => audio.mock.calls.at(-1)![1]());
  fireEvent.click(screen.getByRole('button', { name: 'ㄱ + ㅣ 합쳐보기' }));
  await waitFor(() => expect(timers).toHaveLength(1));
  act(() => timers.shift()!());
  expect(audio).toHaveBeenLastCalledWith('/기.mp3', expect.any(Function), expect.any(Function));
  expect(container.querySelectorAll('[data-made="true"]')).toHaveLength(2);
  expect(screen.getByRole('group', { name: '낱말 만나기' })).toBe(row);
  act(() => audio.mock.calls.at(-1)![1]());
  expect(screen.getByRole('button', { name: '다음으로' })).toBeDisabled();
  await act(async () => timers.shift()!());
  expect(audio).toHaveBeenLastCalledWith('/word.mp3', expect.any(Function), expect.any(Function));
  expect(screen.getByRole('button', { name: '다음으로' })).toBeDisabled();
  act(() => audio.mock.calls.at(-1)![1]());
  expect(screen.getByRole('button', { name: '다음으로' })).toBeEnabled();
  expect(complete).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: '다음으로' }));
  expect(complete).toHaveBeenCalledOnce();
});

it('autoplay rejection retries the formed first syllable without unlocking or skipping', async () => {
  const complete = vi.fn();
  renderBaby(complete);
  await startKoreanDemonstration();
  act(() => audio.mock.calls.at(-1)![2]());
  expect(screen.getByRole('alert')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'ㄱ + ㅣ 합쳐보기' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: '아 낱말 듣기' }));
  await waitFor(() => expect(audio).toHaveBeenCalledTimes(2));
  expect(audio).toHaveBeenLastCalledWith('/아.mp3', expect.any(Function), expect.any(Function));
  act(() => audio.mock.calls.at(-1)![1]());
  expect(screen.getByRole('button', { name: 'ㄱ + ㅣ 합쳐보기' })).toBeEnabled();
  expect(complete).not.toHaveBeenCalled();
});

it('reads a one-syllable target once and waits for that actual word recording', async () => {
  const complete = vi.fn();
  render(
    <WordMeetingActivity
      unitId="kr-h2-u01"
      lang="korean"
      book={{ id: 'kr-h2-u01' } as Storybook}
      word="강"
      onComplete={complete}
      onBack={vi.fn()}
    />
  );
  await startKoreanDemonstration();
  expect(audio).toHaveBeenLastCalledWith('/word.mp3', expect.any(Function), expect.any(Function));
  expect(screen.queryByRole('button', { name: '다음으로' })).not.toBeInTheDocument();
  act(() => audio.mock.calls.at(-1)![1]());
  expect(screen.getByRole('button', { name: '다음으로' })).toBeEnabled();
  expect(audio).toHaveBeenCalledTimes(1);
  expect(complete).not.toHaveBeenCalled();
});

it.each([
  ['강아지', 'ㄱ + ㅏ + ㅇ 합쳐보기', '강'],
  ['까치', 'ㄲ + ㅏ 합쳐보기', '까'],
  ['돼지', 'ㄷ + ㅙ 합쳐보기', '돼'],
  ['바나나', 'ㅂ + ㅏ 합쳐보기', '바'],
])('keeps every jamo and the exact syllable sound for %s', async (word, label, syllable) => {
  render(
    <WordMeetingActivity
      unitId="kr-h2-u01"
      lang="korean"
      book={{ id: 'kr-h2-u01' } as Storybook}
      word={word}
      onComplete={vi.fn()}
      onBack={vi.fn()}
    />
  );
  expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
  await startKoreanDemonstration();
  expect(audio).toHaveBeenLastCalledWith(
    '/' + syllable + '.mp3',
    expect.any(Function),
    expect.any(Function)
  );
});

it('ignores a pending syllable callback after leaving', async () => {
  const view = renderBaby();
  await startKoreanDemonstration();
  const ended = audio.mock.calls.at(-1)![1];
  const count = audio.mock.calls.length;
  view.unmount();
  act(() => ended());
  expect(timers).toHaveLength(0);
  expect(audio).toHaveBeenCalledTimes(count);
  expect(stopAll).toHaveBeenCalled();
});

it('keeps the taught meaning in the story and completes only after the scene', async () => {
  const complete = vi.fn();
  findScene.mockReturnValue({
    illustrationUrl: '/snake.webp',
    pageText: '둥지 안 아기 까치들은 떨었어요.',
    pageTtsUrl: '/bird.mp3',
    pageNumber: 1,
  });
  const book = {
    id: 'kr-h1-u02',
    pages: [
      { text: '아기 새가 자요.', illustrationUrl: '/bird.webp', ttsUrl: '/bird.mp3' },
      {
        text: '이번엔 아기! 그림과 단어를 맞췄어요.',
        illustrationUrl: '/baby-scene.webp',
        ttsUrl: '/baby-scene.mp3',
      },
    ],
  } as Storybook;
  renderBaby(complete, book);
  await startKoreanDemonstration();
  act(() => audio.mock.calls.at(-1)![1]());
  fireEvent.click(screen.getByRole('button', { name: 'ㄱ + ㅣ 합쳐보기' }));
  await waitFor(() => expect(timers).toHaveLength(1));
  act(() => timers.shift()!());
  act(() => audio.mock.calls.at(-1)![1]());
  await act(async () => timers.shift()!());
  act(() => audio.mock.calls.at(-1)![1]());
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
