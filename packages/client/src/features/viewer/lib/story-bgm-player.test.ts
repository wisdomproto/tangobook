import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StoryBgmPlayer } from './story-bgm-player';

const instances: FakeAudio[] = [];
class FakeAudio {
  src = '';
  paused = true;
  volume = 1;
  loop = false;
  preload = '';
  currentTime = 0;
  crossOrigin = '';
  getAttribute(name: string) {
    return name === 'src' ? this.src : null;
  }
  play = vi.fn(() => {
    this.paused = false;
    return Promise.resolve();
  });
  pause = vi.fn(() => {
    this.paused = true;
  });
  constructor() {
    instances.push(this);
  }
}
let player: StoryBgmPlayer;
const flush = async () => {
  await Promise.resolve();
  await Promise.resolve();
};
beforeEach(() => {
  vi.useFakeTimers();
  instances.length = 0;
  vi.stubGlobal('Audio', FakeAudio);
  player = new StoryBgmPlayer(0.3, vi.fn());
});
afterEach(() => {
  player.dispose();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('scene music playback', () => {
  it('does not restart the same cue when pages change', async () => {
    player.setUrl('opening');
    await flush();
    const first = instances.find((a) => !a.paused)!;
    first.currentTime = 23;
    const plays = first.play.mock.calls.length;
    player.setUrl('opening');
    await flush();
    expect(first.currentTime).toBe(23);
    expect(first.play).toHaveBeenCalledTimes(plays);
  });
  it('overlaps old/new music and finishes the fade without losing the user gain', async () => {
    player.setUrl('opening');
    await flush();
    const first = instances.find((a) => !a.paused)!;
    player.setUrl('tension');
    await flush();
    vi.advanceTimersByTime(900);
    const second = instances.find((a) => a.src === 'tension')!;
    expect(first.paused).toBe(false);
    expect(second.paused).toBe(false);
    expect(first.volume).toBeCloseTo(0.15);
    expect(second.volume).toBeCloseTo(0.15);
    player.setVolume(0.1);
    expect(first.volume + second.volume).toBeCloseTo(0.1);
    vi.advanceTimersByTime(900);
    expect(first.paused).toBe(true);
    expect(second.volume).toBeCloseTo(0.1);
  });
  it('keeps music muted when the cue changes and resumes the requested cue on toggle', async () => {
    player.setUrl('opening');
    await flush();
    player.toggle();
    player.setUrl('climax');
    await flush();
    expect(instances.every((a) => a.paused)).toBe(true);
    player.toggle();
    await flush();
    vi.advanceTimersByTime(1800);
    expect(instances.find((a) => a.src === 'climax')?.paused).toBe(false);
  });
  it('handles rapid forward/backward jumps using only the same two elements', async () => {
    player.setUrl('opening');
    await flush();
    player.setUrl('tension');
    await flush();
    vi.advanceTimersByTime(400);
    player.setUrl('climax');
    await flush();
    vi.advanceTimersByTime(400);
    player.setUrl('opening');
    await flush();
    vi.advanceTimersByTime(1800);
    expect(instances).toHaveLength(2);
    expect(instances.filter((a) => !a.paused)).toHaveLength(1);
    expect(instances.find((a) => !a.paused)?.src).toBe('opening');
  });
  it('preserves the current audible cue when the new track cannot start', async () => {
    player.setUrl('opening');
    await flush();
    const first = instances.find((a) => !a.paused)!;
    instances.find((a) => a.paused)!.play.mockRejectedValueOnce(new Error('network'));
    player.setUrl('missing');
    await flush();
    vi.advanceTimersByTime(2000);
    expect(first.paused).toBe(false);
    expect(first.volume).toBeCloseTo(0.3);
  });
  it('retries a blocked first playback on unlock without requiring CORS', async () => {
    vi.stubGlobal(
      'Audio',
      class extends FakeAudio {
        constructor() {
          super();
          this.play.mockRejectedValueOnce(new DOMException('gesture required', 'NotAllowedError'));
        }
      }
    );
    player.setUrl('opening');
    await flush();
    expect(instances.every((a) => a.crossOrigin === '')).toBe(true);
    expect(instances.every((a) => a.paused)).toBe(true);
    player.unlock();
    await flush();
    expect(instances.some((a) => !a.paused && a.volume > 0)).toBe(true);
  });
  it('does not undo an explicit mute when narration unlocks audio', async () => {
    player.setUrl('opening');
    await flush();
    player.toggle();
    player.unlock();
    await flush();
    expect(instances.every((a) => a.paused)).toBe(true);
  });
  it('clears both elements and pending fades on disposal', async () => {
    player.setUrl('opening');
    await flush();
    player.setUrl('tension');
    await flush();
    player.dispose();
    vi.advanceTimersByTime(2000);
    expect(instances.every((a) => a.paused && !a.src)).toBe(true);
  });
});
