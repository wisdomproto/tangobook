import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConsonantTapActivity } from './ConsonantTapActivity';
const audio = vi.hoisted(() => ({
  resolve: vi.fn(async (): Promise<string | undefined> => 'phoneme.mp3'),
  ends: [] as Array<() => void>,
  fails: [] as Array<() => void>,
  praises: [] as Array<() => void>,
}));
vi.mock('@/features/tts', () => ({ resolveTtsUrl: audio.resolve }));
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
    praiseVisible: false,
  }),
}));
afterEach(() => {
  audio.ends = [];
  audio.fails = [];
  audio.praises = [];
  audio.resolve.mockClear();
  audio.resolve.mockResolvedValue('phoneme.mp3');
});
describe('자음5회 충전', () => {
  it.each([...'ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎㄲㄸㅃㅆㅉ'])(
    '%s는5번 실제 발음을 마친 뒤에만 칭찬·완료한다',
    async (letter) => {
      const done = vi.fn();
      render(
        <ConsonantTapActivity
          unitId="kr-test"
          consonant={letter}
          onComplete={done}
          onBack={vi.fn()}
        />
      );
      const button = screen.getByRole('button', { name: `${letter} 눌러 채우기` });
      for (let n = 1; n <= 5; n++) {
        fireEvent.click(button);
        fireEvent.click(button);
        await waitFor(() => expect(audio.ends).toHaveLength(n));
        expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', String(n - 1));
        const end = audio.ends[n - 1];
        act(() => {
          end();
          end();
        });
        expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', String(n));
        expect(done).not.toHaveBeenCalled();
      }
      expect(audio.resolve).toHaveBeenCalledTimes(5);
      expect(audio.praises).toHaveLength(1);
      act(() => audio.praises[0]());
      expect(done).toHaveBeenCalledTimes(1);
      fireEvent.click(button);
      await waitFor(() => expect(audio.ends).toHaveLength(6));
      act(() => audio.ends[5]());
      expect(audio.praises).toHaveLength(1);
    }
  );
  it('음원 로드·재생 오류는 진행이 아니며 같은 칸을 다시 누를 수 있다', async () => {
    audio.resolve.mockResolvedValueOnce(undefined);
    render(
      <ConsonantTapActivity unitId="kr-test" consonant="ㄱ" onComplete={vi.fn()} onBack={vi.fn()} />
    );
    const button = screen.getByRole('button', { name: 'ㄱ 눌러 채우기' });
    fireEvent.click(button);
    await screen.findByRole('status');
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    fireEvent.click(button);
    await waitFor(() => expect(audio.fails).toHaveLength(1));
    act(() => audio.fails[0]());
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    fireEvent.click(button);
    await waitFor(() => expect(audio.ends).toHaveLength(2));
    act(() => audio.ends[1]());
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
  });
});
