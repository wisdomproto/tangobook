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
vi.mock('./HangulPopitActivity', () => ({
  LetterPopitExperience: ({ letter, onComplete }: { letter: string; onComplete: () => void }) => (
    <button onClick={onComplete}>{letter} 팝잇 완료</button>
  ),
}));
it('모든 글자 대소문자 완료가 필요하고, 탭 전환/활성 탭 듣기는 팝잇을 건너뛰지 않는다', async () => {
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
  fireEvent.click(screen.getByRole('button', { name: 'A a' }));
  fireEvent.click(screen.getByRole('button', { name: 'A a' }));
  expect(done).not.toHaveBeenCalled();
  expect(audioEndings).toHaveLength(0);
  for (const upper of ['A', 'B', 'C']) {
    fireEvent.click(screen.getByRole('button', { name: `${upper} 팝잇 완료` }));
    expect(done).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: `${upper.toLowerCase()} 팝잇 완료` }));
    if (upper !== 'C') expect(done).not.toHaveBeenCalled();
  }
  expect(done).toHaveBeenCalledTimes(1);
});
it('팝잇을 마쳐도 해당 그림의 실제 낱말 탐색 전에는 다음 글자나 완료로 가지 않는다', async () => {
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
  for (const upper of ['A', 'B', 'C']) {
    fireEvent.click(screen.getByRole('button', { name: `${upper} 팝잇 완료` }));
    fireEvent.click(screen.getByRole('button', { name: `${upper.toLowerCase()} 팝잇 완료` }));
    expect(done).not.toHaveBeenCalled();
    fireEvent.click(screen.getByAltText(upper + upper.toLowerCase()).parentElement!, {
      clientX: 50,
      clientY: 50,
    });
    expect(done).not.toHaveBeenCalled();
    await act(async () => audioEndings.shift()?.());
    await act(async () => audioEndings.shift()?.());
  }
  expect(done).toHaveBeenCalledTimes(1);
  rect.mockRestore();
});
