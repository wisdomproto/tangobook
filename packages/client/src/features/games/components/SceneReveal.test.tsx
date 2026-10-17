import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { SceneReveal } from './SceneReveal';

const sound = vi.hoisted(() => ({ play: vi.fn(), stop: vi.fn() }));
vi.mock('../hooks/useGameAudio', () => ({
  useGameAudio: () => ({ playAudio: sound.play, stopAll: sound.stop }),
}));
beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
});
afterEach(() => vi.useRealTimers());
const ready = (container: HTMLElement) => fireEvent.load(container.querySelector('img')!);

it('그림이 뜨기 전에는 읽기/노출 시간을 시작하지 않고, 실제 발음 종료 뒤 전환한다', () => {
  const done = vi.fn();
  const view = render(
    <SceneReveal illustrationUrl="/scene.webp" ttsUrl="/voice.mp3" onDone={done} />
  );
  act(() => vi.advanceTimersByTime(10000));
  expect(sound.play).not.toHaveBeenCalled();
  expect(done).not.toHaveBeenCalled();
  ready(view.container);
  expect(sound.play).toHaveBeenCalledWith('/voice.mp3', expect.any(Function), expect.any(Function));
  act(() => vi.advanceTimersByTime(4000));
  expect(done).not.toHaveBeenCalled();
  act(() => sound.play.mock.calls[0][1]());
  expect(done).toHaveBeenCalledTimes(1);
});

it('짧은 발음/실패도 그림을 최소2.5초 보여주고 스킵과 늦은 콜백이 겹쳐도 한 번만 전환한다', () => {
  const done = vi.fn();
  const view = render(
    <SceneReveal illustrationUrl="/scene.webp" ttsUrl="/voice.mp3" onDone={done} />
  );
  ready(view.container);
  act(() => sound.play.mock.calls[0][2]());
  act(() => vi.advanceTimersByTime(2499));
  expect(done).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: '다음으로' }));
  fireEvent.click(screen.getByRole('button', { name: '다음으로' }));
  act(() => {
    vi.advanceTimersByTime(100);
    sound.play.mock.calls[0][1]();
  });
  expect(done).toHaveBeenCalledTimes(1);
  expect(sound.stop).toHaveBeenCalled();
});

it('음원/그림 실패 때도 빠져나오며 이탈 후 예약 전환은 취소한다', () => {
  const done = vi.fn();
  const view = render(<SceneReveal illustrationUrl="/bad.webp" onDone={done} />);
  fireEvent.error(view.container.querySelector('img')!);
  act(() => vi.advanceTimersByTime(2999));
  expect(done).not.toHaveBeenCalled();
  view.unmount();
  act(() => vi.runAllTimers());
  expect(done).not.toHaveBeenCalled();
});
