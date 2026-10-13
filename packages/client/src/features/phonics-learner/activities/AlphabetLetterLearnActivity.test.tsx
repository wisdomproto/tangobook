import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { AlphabetLetterLearnActivity } from './AlphabetLetterLearnActivity';

const { audioEndings, resolve, lesson } = vi.hoisted(() => ({
  audioEndings: [] as (() => void)[],
  lesson: { withHotspots: false },
  resolve: vi.fn(async () => 'letter.mp3'),
}));
vi.mock('@/features/storybook/hooks/useStorybooks', () => ({
  useStorybook: () => ({
    data: {
      phonicsLesson: {
        blending: ['A', 'B', 'C'].map((vowel) => ({
          vowel,
          illustrationUrl: lesson.withHotspots ? `/${vowel}.png` : undefined,
        })),
        wordFamilies: lesson.withHotspots
          ? ['A', 'B', 'C'].map((word) => ({
              words: [{ word, ttsUrl: `${word}.mp3`, hotspots: [{ x: 0, y: 0, w: 1, h: 1 }] }],
            }))
          : [],
      },
    },
  }),
}));
vi.mock('@/features/tts', () => ({ resolveTtsUrl: resolve }));
vi.mock('../hooks/usePhonicsTtsWarm', () => ({ usePhonicsTtsWarm: vi.fn() }));
vi.mock('../hooks/useEntryGuide', () => ({
  useEntryGuide: vi.fn(),
  ENTRY_GUIDE: { tap: '' },
  praiseLang: () => 'ko',
}));
vi.mock('@/features/games/hooks/useGameAudio', () => ({
  useGameAudio: () => ({
    playAudio: vi.fn((_url: string, onEnded?: () => void) => {
      if (onEnded) audioEndings.push(onEnded);
    }),
    playCorrectSequence: vi.fn((opts: { onDone?: () => void }) => opts.onDone?.()),
    scheduleTimer: vi.fn((fn: () => void) => fn()),
    praiseVisible: false,
  }),
}));
beforeEach(() => {
  audioEndings.length = 0;
  lesson.withHotspots = false;
  resolve.mockResolvedValue('letter.mp3');
});
it('requires all letters, counts actual audio endings, and never counts a switched tab', async () => {
  const done = vi.fn();
  render(
    <AlphabetLetterLearnActivity
      unitId="en-b1-u01"
      letters={['A', 'B', 'C']}
      onMarkComplete={done}
      onBack={vi.fn()}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: 'B b' }));
  expect(done).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'A a' }));
  for (const letter of ['A a', 'B b', 'C c']) {
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: letter }));
    });
    expect(done).not.toHaveBeenCalled();
    await act(async () => {
      audioEndings.shift()?.();
    });
  }
  expect(done).toHaveBeenCalledTimes(1);
});
it('missing audio is not a completed listening interaction', async () => {
  resolve.mockResolvedValue(undefined as unknown as string);
  const done = vi.fn();
  render(
    <AlphabetLetterLearnActivity
      unitId="en-b1-u01"
      letters={['A']}
      onMarkComplete={done}
      onBack={vi.fn()}
    />
  );
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'A a' }));
  });
  expect(audioEndings).toHaveLength(0);
  expect(done).not.toHaveBeenCalled();
  expect(screen.getByRole('alert').textContent).toContain('다시 눌러봐');
});

it('finishing one illustration never marks the next same-size illustration as learned', async () => {
  lesson.withHotspots = true;
  const rect = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    left: 0,
    top: 0,
    width: 100,
    height: 100,
    right: 100,
    bottom: 100,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });
  const done = vi.fn();
  render(
    <AlphabetLetterLearnActivity
      unitId="en-b1-u01"
      letters={['A', 'B', 'C']}
      onMarkComplete={done}
      onBack={vi.fn()}
    />
  );
  for (const letter of ['Aa', 'Bb', 'Cc']) {
    fireEvent.click(screen.getByAltText(letter).parentElement!, { clientX: 50, clientY: 50 });
    expect(done).not.toHaveBeenCalled();
    await act(async () => {
      audioEndings.shift()?.();
    });
    await act(async () => {
      audioEndings.shift()?.();
    });
  }
  expect(done).toHaveBeenCalledTimes(1);
  rect.mockRestore();
});
