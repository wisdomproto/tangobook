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
describe('자음 팝잇 연결', () => {
  it('쌍자음의 지정 발음을 최종 완료까지 그대로 사용한다', async () => {
    const done = vi.fn();
    render(
      <ConsonantTapActivity
        unitId="kr-test"
        consonant="ㄲ"
        soundText="끄"
        onComplete={done}
        onBack={vi.fn()}
      />
    );
    const buttons = screen.getAllByRole('button', { name: /ㄲ 방울/ });
    buttons.forEach((b) => fireEvent.click(b));
    await waitFor(() => expect(audio.ends).toHaveLength(1));
    expect(audio.resolve).toHaveBeenCalledWith(
      expect.objectContaining({ text: '끄', language: 'korean' })
    );
    act(() => audio.ends[0]());
    await waitFor(() => expect(audio.ends).toHaveLength(2));
    act(() => audio.ends[1]());
    await waitFor(() => expect(audio.praises).toHaveLength(1));
    expect(done).not.toHaveBeenCalled();
    act(() => audio.praises[0]());
    expect(done).toHaveBeenCalledTimes(1);
  });
  it('발음이 없으면 완료하지 않으며 방울 상태를 유지한 채 다시 듣는다', async () => {
    audio.resolve.mockResolvedValue(undefined);
    const done = vi.fn();
    render(
      <ConsonantTapActivity unitId="kr-test" consonant="ㄴ" onComplete={done} onBack={vi.fn()} />
    );
    screen.getAllByRole('button', { name: /ㄴ 방울/ }).forEach((b) => fireEvent.click(b));
    const retry = await screen.findByRole('button', { name: /소리를/ });
    expect(done).not.toHaveBeenCalled();
    audio.resolve.mockResolvedValue('phoneme.mp3');
    fireEvent.click(retry);
    await waitFor(() => expect(audio.ends).toHaveLength(1));
    act(() => audio.ends[0]());
    await waitFor(() => expect(audio.praises).toHaveLength(1));
    act(() => audio.praises[0]());
    expect(done).toHaveBeenCalledTimes(1);
  });
});
