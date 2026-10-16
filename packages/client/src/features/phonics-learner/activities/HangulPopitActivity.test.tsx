import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HangulPopitActivity } from './HangulPopitActivity';
import { ConsonantTapActivity } from './ConsonantTapActivity';
import { VowelListenActivity } from './VowelListenActivity';
import { POPIT_ALPHABET } from '../lib/popit-letter-designs';

const audio = vi.hoisted(() => ({
  resolve: vi.fn(async (): Promise<string | undefined> => 'phoneme.mp3'),
  ends: [] as Array<() => void>,
  fails: [] as Array<() => void>,
  praises: [] as Array<() => void>,
  pop: vi.fn(),
}));
vi.mock('@/features/tts', () => ({ resolveTtsUrl: audio.resolve }));
vi.mock('@/lib/uiSound', () => ({ playUi: audio.pop }));
vi.mock('../hooks/usePhonicsTtsWarm', () => ({ usePhonicsTtsWarm: vi.fn() }));
vi.mock('../hooks/useEntryGuide', () => ({
  useEntryGuide: vi.fn(),
  ENTRY_GUIDE: { listenExplore: '' },
  praiseLang: () => 'ko',
}));
vi.mock('@/features/games/hooks/useGameAudio', () => ({
  useGameAudio: () => ({
    playAudio: (_url: string, end: () => void, fail: () => void) => {
      audio.ends.push(end);
      audio.fails.push(fail);
    },
    playCorrectSequence: ({ onDone }: { onDone: () => void }) => audio.praises.push(onDone),
  }),
}));

afterEach(() => {
  audio.ends = [];
  audio.fails = [];
  audio.praises = [];
  audio.resolve.mockReset().mockResolvedValue('phoneme.mp3');
  audio.pop.mockClear();
});

describe('말랑 자모 팝잇', () => {
  it.each(POPIT_ALPHABET)(
    '%s의 방울은 즉시 눌리며, 연타는 중복 진행 없이 마지막 발음·칭찬 후 한 번만 완료한다',
    async (letter) => {
      const done = vi.fn();
      const next = vi.fn();
      if (/[ㅏ-ㅣ]/.test(letter))
        render(
          <VowelListenActivity
            unitId="kr-v1-u01"
            vowels={[{ vowel: letter, syllable: letter }]}
            onMarkComplete={done}
            onNext={next}
            onBack={vi.fn()}
          />
        );
      else if (/[A-Za-z]/.test(letter))
        render(
          <HangulPopitActivity
            unitId="en-test"
            letter={letter}
            sound={letter.toLowerCase()}
            language="english"
            prefix="en-letter"
            onComplete={done}
            onBack={vi.fn()}
          />
        );
      else
        render(
          <ConsonantTapActivity
            unitId="kr-test"
            consonant={letter}
            onComplete={done}
            onBack={vi.fn()}
          />
        );
      const bubbles = screen.getAllByRole('button', { name: new RegExp(`${letter} 방울`) });
      fireEvent.click(bubbles[0]);
      expect(bubbles[0]).toHaveAttribute('aria-pressed', 'true');
      fireEvent.click(bubbles[0]);
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
      // No pronunciation wait is imposed on the next touch.
      bubbles.slice(1).forEach((bubble) => fireEvent.click(bubble));
      expect(screen.getByRole('progressbar')).toHaveAttribute(
        'aria-valuenow',
        String(bubbles.length)
      );
      expect(audio.pop).toHaveBeenCalledTimes(bubbles.length);
      await waitFor(() => expect(audio.ends).toHaveLength(1));
      expect(done).not.toHaveBeenCalled();
      act(() => audio.ends[0]());
      await waitFor(() => expect(audio.ends).toHaveLength(2));
      expect(audio.praises).toHaveLength(0);
      act(() => audio.ends[1]());
      await waitFor(() => expect(audio.praises).toHaveLength(1));
      expect(done).not.toHaveBeenCalled();
      expect(screen.queryByRole('button', { name: '써보기 →' })).toBeNull();
      act(() => {
        audio.praises[0]();
        audio.praises[0]();
      });
      expect(done).toHaveBeenCalledTimes(1);
      if (letter === 'ㅏ') {
        fireEvent.click(screen.getByRole('button', { name: '써보기 →' }));
        expect(next).toHaveBeenCalledTimes(1);
      }
      fireEvent.click(bubbles[0]);
      expect(audio.praises).toHaveLength(1);
    }
  );

  it('최종 발음 실패는 완료하지 않으며 눌린 상태를 보존하고 재시도한다', async () => {
    const done = vi.fn();
    render(
      <HangulPopitActivity
        unitId="kr-test"
        letter="ㄱ"
        prefix="consonant-tap"
        onComplete={done}
        onBack={vi.fn()}
      />
    );
    screen.getAllByRole('button', { name: /ㄱ 방울/ }).forEach((bubble) => fireEvent.click(bubble));
    await waitFor(() => expect(audio.ends).toHaveLength(1));
    act(() => audio.ends[0]());
    await waitFor(() => expect(audio.ends).toHaveLength(2));
    act(() => audio.fails[1]());
    const retry = await screen.findByRole('button', { name: /소리를/ });
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '5');
    expect(done).not.toHaveBeenCalled();
    expect(audio.praises).toHaveLength(0);
    fireEvent.click(retry);
    await waitFor(() => expect(audio.ends).toHaveLength(3));
    act(() => audio.ends[2]());
    await waitFor(() => expect(audio.praises).toHaveLength(1));
    act(() => audio.praises[0]());
    expect(done).toHaveBeenCalledTimes(1);
  });

  it('모두 누른 뒤 이탈한 활동의 늦은 음성은 완료를 기록하지 않는다', async () => {
    const done = vi.fn();
    const view = render(
      <HangulPopitActivity
        unitId="kr-test"
        letter="ㅇ"
        prefix="consonant-tap"
        onComplete={done}
        onBack={vi.fn()}
      />
    );
    screen.getAllByRole('button', { name: /ㅇ 방울/ }).forEach((bubble) => fireEvent.click(bubble));
    await waitFor(() => expect(audio.ends).toHaveLength(1));
    view.unmount();
    await act(async () => audio.ends[0]());
    expect(audio.ends).toHaveLength(1);
    expect(done).not.toHaveBeenCalled();
  });
});
