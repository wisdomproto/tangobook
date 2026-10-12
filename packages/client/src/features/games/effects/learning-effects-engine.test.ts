import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLearningEffectsEngine } from './learning-effects-engine';
import { LEARNING_EFFECTS } from './learning-effects';
const mock = vi.hoisted(() => ({
  sleep: vi.fn(),
  wake: vi.fn(),
  destroy: vi.fn(),
  step: vi.fn(),
  stall: false,
  on: vi.fn(),
  kill: vi.fn(),
  remove: vi.fn(),
}));
vi.mock('phaser', () => {
  class Scene {
    textures = { exists: () => false }; // geometry fallback if a procedural texture is unavailable
    cameras = { main: { setViewport: vi.fn() } };
    tweens = { add: vi.fn(), killAll: mock.kill };
    time = { delayedCall: vi.fn(), removeAllEvents: mock.remove };
    add = {
      graphics: () => {
        const graphics = {
          clear: () => graphics,
          lineStyle: () => graphics,
          strokeCircle: () => graphics,
          fillStyle: () => graphics,
          fillCircle: () => graphics,
          fillEllipse: () => graphics,
          generateTexture: () => graphics,
          strokeRoundedRect: () => graphics,
          fillRoundedRect: () => graphics,
          beginPath: () => graphics,
          arc: () => graphics,
          moveTo: () => graphics,
          lineTo: () => graphics,
          strokePath: () => graphics,
          setPosition: () => graphics,
          setScale: () => graphics,
          destroy: vi.fn(),
        };
        return graphics;
      },
    };
    create() {}
  }
  class Game {
    loop = { sleep: mock.sleep, wake: mock.wake };
    scale = { resize: vi.fn() };
    events = { on: mock.on };
    destroy = mock.destroy;
    step = mock.step;
    constructor(config: { scene: Scene[] }) {
      if (!mock.stall) queueMicrotask(() => config.scene[0].create());
    }
  }
  return { Scene, Game, AUTO: 0, Core: { Events: { RESUME: 'resume' } } };
});

describe('learning renderer resource lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mock.stall = false;
  });
  afterEach(() => vi.useRealTimers());
  it.each(LEARNING_EFFECTS)('releases $kind effects when leaving an activity', async ({ kind }) => {
    const parent = document.createElement('div');
    const engine = await createLearningEffectsEngine(parent);
    engine.play({ kind, x: 60, y: 60, size: 100, bounds: { x: 0, y: 0, width: 300, height: 300 } });
    engine.clear();
    expect(parent.dataset.effectsState).toBe('idle');
    expect(mock.kill).toHaveBeenCalled();
    expect(mock.remove).toHaveBeenCalled();
    engine.destroy();
    expect(vi.getTimerCount()).toBe(0);
  });
  it('falls back to geometry without a procedural texture, sleeps after the response, and drains deferred destruction while asleep', async () => {
    const parent = document.createElement('div');
    const engine = await createLearningEffectsEngine(parent);
    expect(parent.dataset.effectsState).toBe('idle');
    engine.play({
      kind: 'correct',
      x: 60,
      y: 60,
      size: 100,
      bounds: { x: 0, y: 0, width: 300, height: 300 },
    });
    expect(parent.dataset.effectsState).toBe('playing');
    expect(mock.wake).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(1600);
    expect(parent.dataset.effectsState).toBe('idle');
    engine.destroy();
    expect(mock.destroy).toHaveBeenCalledWith(true);
    expect(mock.step).toHaveBeenCalledWith(0, 0);
    engine.play({
      kind: 'tap',
      x: 60,
      y: 60,
      size: 100,
      bounds: { x: 0, y: 0, width: 300, height: 300 },
    });
    expect(mock.wake).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });
  it('returns to idle after Phaser resumes a background tab', async () => {
    const parent = document.createElement('div');
    const engine = await createLearningEffectsEngine(parent);
    const resume = mock.on.mock.calls.find(([name]) => name === 'resume')![1] as () => void;
    resume();
    expect(mock.sleep).toHaveBeenCalledTimes(2);
    engine.destroy();
  });
  it('bounds a stalled renderer startup and releases it instead of blocking learning indefinitely', async () => {
    mock.stall = true;
    const pending = createLearningEffectsEngine(document.createElement('div'));
    const assertion = expect(pending).rejects.toThrow('timed out');
    await vi.advanceTimersByTimeAsync(6000);
    await assertion;
    expect(mock.destroy).toHaveBeenCalledOnce();
    expect(mock.step).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });
});
