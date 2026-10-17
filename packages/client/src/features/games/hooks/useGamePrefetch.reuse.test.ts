import { afterEach, beforeEach, expect, it, vi } from 'vitest';
vi.mock('@/features/tts', () => ({ resolveTtsUrl: vi.fn() }));
import { warmAudioUrl } from './useGamePrefetch';

class PreparedAudio extends EventTarget {
  src = '';
  currentSource: string | undefined;
  get currentSrc() {
    return this.currentSource ?? this.src;
  }
  readyState = 0;
  error: object | null = null;
  paused = true;
  seeking = false;
  currentTime = 0;
  preload = '';
  muted = false;
  bufferStart = 0;
  bufferEnd = 0;
  get buffered() {
    return {
      length: this.bufferEnd ? 1 : 0,
      start: () => this.bufferStart,
      end: () => this.bufferEnd,
    };
  }
  load = vi.fn();
  play = vi.fn();
  pause = vi.fn();
  removeAttribute = vi.fn((name: string) => {
    if (name === 'src') this.src = '';
  });
  constructor() {
    super();
    voices.push(this);
  }
  complete() {
    this.readyState = 4;
    this.bufferEnd = 1;
    this.dispatchEvent(new Event('loadeddata'));
  }
}
const voices: PreparedAudio[] = [];
const retained = (url: string) => warmAudioUrl(url, { reusePrepared: true });
beforeEach(() => {
  vi.useFakeTimers();
  voices.length = 0;
  vi.stubGlobal('Audio', PreparedAudio);
});
afterEach(async () => {
  await vi.runAllTimersAsync();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it('reuses a real prepared buffer without loading or playing it again', async () => {
  const first = retained('prepared.mp3');
  expect(retained('prepared.mp3')).toBe(first);
  let done = false;
  void first.then(() => (done = true));
  await Promise.resolve();
  expect(done).toBe(false);
  voices[0].complete();
  await first;
  await retained('prepared.mp3');
  expect(voices).toHaveLength(1);
  expect(voices[0].load).toHaveBeenCalledTimes(1);
  expect(voices[0].play).not.toHaveBeenCalled();
  expect(voices[0].muted).toBe(true);
});

it.each([
  [
    'lost readiness',
    (a: PreparedAudio) => {
      a.readyState = 1;
    },
  ],
  [
    'evicted buffer',
    (a: PreparedAudio) => {
      a.bufferEnd = 0;
    },
  ],
  [
    'missing beginning',
    (a: PreparedAudio) => {
      a.bufferStart = 0.5;
    },
  ],
  [
    'error',
    (a: PreparedAudio) => {
      a.error = {};
    },
  ],
  [
    'changed source',
    (a: PreparedAudio) => {
      a.src = 'changed.mp3';
    },
  ],
  [
    'different current source',
    (a: PreparedAudio) => {
      a.currentSource = 'changed.mp3';
    },
  ],
  [
    'seeking',
    (a: PreparedAudio) => {
      a.seeking = true;
    },
  ],
  [
    'playing',
    (a: PreparedAudio) => {
      a.paused = false;
    },
  ],
  [
    'advanced position',
    (a: PreparedAudio) => {
      a.currentTime = 0.5;
    },
  ],
])('waits for real preparation again after %s', async (_, change) => {
  const url = `invalid-${voices.length}.mp3`;
  const first = retained(url);
  voices[0].complete();
  await first;
  change(voices[0]);
  let done = false;
  const retry = retained(url).then(() => (done = true));
  await Promise.resolve();
  expect(done).toBe(false);
  expect(voices).toHaveLength(2);
  expect(voices[0].removeAttribute).toHaveBeenCalledWith('src');
  voices[1].complete();
  await retry;
});

it('never retains errors or the existing four-second timeout as success', async () => {
  const error = retained('error.mp3');
  voices[0].dispatchEvent(new Event('error'));
  await error;
  let done = false;
  const retry = retained('error.mp3').then(() => (done = true));
  await vi.advanceTimersByTimeAsync(3999);
  expect(done).toBe(false);
  await vi.advanceTimersByTimeAsync(1);
  await retry;
  const afterTimeout = retained('error.mp3');
  expect(voices).toHaveLength(3);
  voices[2].complete();
  await afterTimeout;
});

it('shares active default preparation but keeps subsequent default callers unchanged', async () => {
  const initial = warmAudioUrl('shared.mp3');
  expect(retained('shared.mp3')).toBe(initial);
  voices[0].complete();
  await initial;
  await retained('shared.mp3');
  expect(voices).toHaveLength(1);
  const defaultNext = warmAudioUrl('shared.mp3');
  expect(voices).toHaveLength(2);
  voices[1].complete();
  await defaultNext;
});

it('releases prepared buffers after five minutes, then waits again', async () => {
  const first = retained('expires.mp3');
  voices[0].complete();
  await first;
  await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
  expect(voices[0].src).toBe('');
  expect(voices[0].pause).toHaveBeenCalled();
  const next = retained('expires.mp3');
  expect(voices).toHaveLength(2);
  voices[1].complete();
  await next;
});

it('bounds retained objects to 24 and releases the least recently reused one', async () => {
  for (let i = 0; i < 24; i++) {
    const pending = retained(`bound-${i}.mp3`);
    voices[i].complete();
    await pending;
  }
  await retained('bound-0.mp3');
  const next = retained('bound-24.mp3');
  voices[24].complete();
  await next;
  expect(voices[1].src).toBe('');
  expect(voices[0].src).toBe('bound-0.mp3');
  await retained('bound-0.mp3');
  expect(voices).toHaveLength(25);
  const evicted = retained('bound-1.mp3');
  expect(voices).toHaveLength(26);
  voices[25].complete();
  await evicted;
});
