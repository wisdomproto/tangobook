import { afterEach, beforeEach, expect, it, vi } from 'vitest';

vi.mock('@/features/tts', () => ({ resolveTtsUrl: vi.fn() }));
import { warmAudioUrl } from './useGamePrefetch';

class TestAudio extends EventTarget {
  src = '';
  preload = '';
  muted = false;
  load = vi.fn();
  constructor() {
    super();
    voices.push(this);
  }
}
const voices: TestAudio[] = [];
beforeEach(() => {
  vi.useFakeTimers();
  voices.length = 0;
  vi.stubGlobal('Audio', TestAudio);
});
afterEach(async () => {
  await vi.runAllTimersAsync();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it('shares concurrent decoding, then checks actual media readiness on re-entry', async () => {
  const first = warmAudioUrl('voice.mp3');
  const otherConsumer = warmAudioUrl('voice.mp3');
  expect(otherConsumer).toBe(first);
  expect(voices).toHaveLength(1);
  let done = false;
  void first.then(() => (done = true));
  await Promise.resolve();
  expect(done).toBe(false);
  voices[0].dispatchEvent(new Event('loadeddata'));
  await first;
  expect(done).toBe(true);
  expect(vi.getTimerCount()).toBe(0);
  const reentry = warmAudioUrl('voice.mp3');
  expect(reentry).not.toBe(first);
  expect(voices).toHaveLength(2);
  voices[1].dispatchEvent(new Event('canplaythrough'));
  await reentry;
});

it('does not retain failed or timed-out readiness and keeps the existing four second cap', async () => {
  const failed = warmAudioUrl('retry.mp3');
  voices[0].dispatchEvent(new Event('error'));
  await failed;
  let done = false;
  const retry = warmAudioUrl('retry.mp3').then(() => (done = true));
  expect(voices).toHaveLength(2);
  await vi.advanceTimersByTimeAsync(3999);
  expect(done).toBe(false);
  await vi.advanceTimersByTimeAsync(1);
  await retry;
  expect(done).toBe(true);
  const next = warmAudioUrl('retry.mp3');
  expect(voices).toHaveLength(3);
  voices[2].dispatchEvent(new Event('loadeddata'));
  await next;
});

it('ignores empty URLs without creating an audio request', async () => {
  await warmAudioUrl('');
  expect(voices).toHaveLength(0);
});
