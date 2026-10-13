import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WordListenChooseActivity } from './WordListenChooseActivity';

const { spoken, playAudio } = vi.hoisted(() => ({
  spoken: [] as string[],
  playAudio: vi.fn((_url: string, onEnded?: () => void) => onEnded?.()),
}));
vi.mock('@/features/tts', () => ({
  resolveTtsUrl: vi.fn(async ({ text }: { text: string }) => {
    spoken.push(text);
    return `tts:${text}`;
  }),
}));
vi.mock('../hooks/usePhonicsTtsWarm', () => ({ usePhonicsTtsWarm: vi.fn() }));
vi.mock('@/features/games/hooks/useGameAudio', () => ({
  useGameAudio: () => ({
    playAudio,
    playFeedbackSound: vi.fn(),
    playCorrectSequence: vi.fn(),
    praiseVisible: false,
  }),
}));
afterEach(() => {
  vi.useRealTimers();
  spoken.length = 0;
});

describe('입문 듣기 놀이', () => {
  it('실제 판도 두 보기부터 네 보기로 늘고 내용이 같은 새 배열에도 문제를 유지한다', async () => {
    vi.useFakeTimers();
    const items = ['ㅏ', 'ㅑ', 'ㅓ', 'ㅕ'].map((label, index) => ({
      label,
      sound: ['아', '야', '어', '여'][index],
    }));
    const onMarkComplete = vi.fn();
    const props = {
      unitId: 'kr-h1-u01',
      progressiveChoices: true,
      illustratedLetters: true,
      onMarkComplete,
      onBack: vi.fn(),
    };
    const view = render(<WordListenChooseActivity {...props} items={items} />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(450);
    });
    const answered = new Set<string>();
    for (let round = 0; round < 4; round++) {
      const target = spoken.at(-1)!;
      const answer = items.find((item) => item.sound === target)!;
      expect(answer).toBeDefined();
      expect(answered.has(target)).toBe(false);
      expect(
        screen
          .getAllByRole('button')
          .filter((button) =>
            items.some((item) => item.label === button.getAttribute('aria-label'))
          )
      ).toHaveLength(Math.min(4, round + 2));
      view.rerender(
        <WordListenChooseActivity {...props} items={items.map((item) => ({ ...item }))} />
      );
      expect(spoken.at(-1)).toBe(target);
      fireEvent.click(screen.getByRole('button', { name: answer.label }));
      answered.add(target);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(900);
      });
    }
    expect(answered.size).toBe(4);
    expect(onMarkComplete).toHaveBeenCalledTimes(1);
  });
});
