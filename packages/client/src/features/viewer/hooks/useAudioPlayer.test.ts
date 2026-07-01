import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAudioPlayer } from './useAudioPlayer';

// ---------------------------------------------------------------------------
// Audio mock — captures all instances so we can inspect them after playTts.
// Exposes playbackRate (default 1), play() → resolved promise, pause(), etc.
// ---------------------------------------------------------------------------
const audioInstances: AudioMock[] = [];

class AudioMock {
  src: string;
  currentTime = 0;
  duration = NaN;
  playbackRate = 1;
  paused = true;
  preload = '';
  readyState = 0;
  loop = false;
  volume = 1;

  private _listeners: Record<string, Array<(e?: unknown) => void>> = {};

  constructor(src = '') {
    this.src = src;
    audioInstances.push(this);
  }

  play = vi.fn(() => {
    this.paused = false;
    return Promise.resolve();
  });

  pause = vi.fn(() => {
    this.paused = true;
  });

  addEventListener = vi.fn((event: string, handler: (e?: unknown) => void, _options?: unknown) => {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(handler);
  });

  removeEventListener = vi.fn();

  _emit(event: string, eventObj?: unknown) {
    (this._listeners[event] ?? []).forEach((h) => h(eventObj));
  }
}

vi.stubGlobal('Audio', AudioMock);

// AbortController is available in jsdom; no stub needed.

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function lastAudioFor(url: string): AudioMock | undefined {
  // Returns the most recently created Audio whose src matches url.
  return [...audioInstances].reverse().find((a) => a.src === url);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useAudioPlayer — playbackRate', () => {
  beforeEach(() => {
    audioInstances.length = 0;
    vi.clearAllMocks();
  });

  it('exposes setPlaybackRate in the return value', () => {
    const { result } = renderHook(() => useAudioPlayer({}));
    expect(typeof result.current.setPlaybackRate).toBe('function');
  });

  it('default: playTts sets playbackRate === 1 on the played audio', async () => {
    const { result } = renderHook(() => useAudioPlayer({}));

    await act(async () => {
      await result.current.playTts('https://cdn/tts1.mp3');
    });

    const audio = lastAudioFor('https://cdn/tts1.mp3');
    expect(audio).toBeDefined();
    expect(audio!.playbackRate).toBe(1);
  });

  it('after setPlaybackRate(1.25), playTts uses 1.25 on new audio', async () => {
    const { result } = renderHook(() => useAudioPlayer({}));

    act(() => {
      result.current.setPlaybackRate(1.25);
    });

    await act(async () => {
      await result.current.playTts('https://cdn/tts2.mp3');
    });

    const audio = lastAudioFor('https://cdn/tts2.mp3');
    expect(audio).toBeDefined();
    expect(audio!.playbackRate).toBe(1.25);
  });

  it('after setPlaybackRate(0.75), playTts uses 0.75', async () => {
    const { result } = renderHook(() => useAudioPlayer({}));

    act(() => {
      result.current.setPlaybackRate(0.75);
    });

    await act(async () => {
      await result.current.playTts('https://cdn/tts3.mp3');
    });

    const audio = lastAudioFor('https://cdn/tts3.mp3');
    expect(audio).toBeDefined();
    expect(audio!.playbackRate).toBe(0.75);
  });

  it('preloaded url then playTts uses current rate (pooled object gets rate at play time)', async () => {
    const { result } = renderHook(() => useAudioPlayer({}));

    // Preload first (creates Audio in pool with default rate=1)
    act(() => {
      result.current.preloadTts(['https://cdn/preloaded.mp3']);
    });

    // Change rate AFTER preloading
    act(() => {
      result.current.setPlaybackRate(1.25);
    });

    // Play the preloaded url — pool object should still get new rate applied at play()
    await act(async () => {
      await result.current.playTts('https://cdn/preloaded.mp3');
    });

    const audio = lastAudioFor('https://cdn/preloaded.mp3');
    expect(audio).toBeDefined();
    // The rate must be set to 1.25 right before play() is called
    expect(audio!.playbackRate).toBe(1.25);
  });

  it('setPlaybackRate while TTS is playing updates the live element immediately', async () => {
    const { result } = renderHook(() => useAudioPlayer({}));

    // Start playing
    await act(async () => {
      await result.current.playTts('https://cdn/live.mp3');
    });

    const audio = lastAudioFor('https://cdn/live.mp3');
    expect(audio).toBeDefined();
    expect(audio!.playbackRate).toBe(1); // default

    // Change rate while "playing"
    act(() => {
      result.current.setPlaybackRate(1.25);
    });

    // The live audio element should be updated immediately
    expect(audio!.playbackRate).toBe(1.25);
  });

  it('setPlaybackRate does NOT affect BGM audio element', async () => {
    const { result } = renderHook(() =>
      useAudioPlayer({ backgroundMusicUrl: 'https://cdn/bgm.mp3' })
    );

    // BGM Audio is created during useEffect (first render)
    const bgm = lastAudioFor('https://cdn/bgm.mp3');
    expect(bgm).toBeDefined();
    const bgmInitialRate = bgm!.playbackRate; // should be 1 (default)

    // Play a TTS at 1.25×
    act(() => {
      result.current.setPlaybackRate(1.25);
    });
    await act(async () => {
      await result.current.playTts('https://cdn/bgm-tts.mp3');
    });

    // BGM element's playbackRate must stay at its initial value (not 1.25)
    expect(bgm!.playbackRate).toBe(bgmInitialRate);
  });

  it('rate persists across multiple playTts calls', async () => {
    const { result } = renderHook(() => useAudioPlayer({}));

    act(() => {
      result.current.setPlaybackRate(1.25);
    });

    // Capture first audio reference immediately after play (before next playTts clears its src)
    let audio1: AudioMock | undefined;
    await act(async () => {
      await result.current.playTts('https://cdn/p1.mp3');
      audio1 = lastAudioFor('https://cdn/p1.mp3');
    });

    // Second play — new Audio created for a different url
    await act(async () => {
      await result.current.playTts('https://cdn/p2.mp3');
    });
    const audio2 = lastAudioFor('https://cdn/p2.mp3');

    // Both should have had 1.25 applied at play() time
    expect(audio1).toBeDefined();
    expect(audio1!.playbackRate).toBe(1.25);
    expect(audio2).toBeDefined();
    expect(audio2!.playbackRate).toBe(1.25);
  });
});
