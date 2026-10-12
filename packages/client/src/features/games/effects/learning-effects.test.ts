import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearLearningEffects,
  emitLearningEffect,
  rememberLearningTarget,
  subscribeLearningEffects,
  type EffectMessage,
} from './learning-effects';

describe('learning effects routing', () => {
  let messages: EffectMessage[];
  let unsubscribe: () => void;
  let target: HTMLButtonElement;
  beforeEach(() => {
    clearLearningEffects();
    messages = [];
    unsubscribe = subscribeLearningEffects((event) => messages.push(event));
    document.body.innerHTML =
      '<section class="learning-stage"><button>가</button><button>나</button></section>';
    target = document.querySelector('button')!;
    const rect = {
      left: 20,
      top: 80,
      right: 420,
      bottom: 480,
      width: 400,
      height: 400,
      x: 20,
      y: 80,
      toJSON: () => ({}),
    };
    vi.spyOn(target.parentElement!, 'getBoundingClientRect').mockReturnValue(rect);
    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue({
      ...rect,
      width: 100,
      height: 120,
      right: 120,
      bottom: 200,
    });
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
  });
  afterEach(() => {
    unsubscribe();
    clearLearningEffects();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });
  it('anchors a correct response to the last actual input, deduplicating its simultaneous praise', () => {
    rememberLearningTarget(target);
    emitLearningEffect('correct');
    emitLearningEffect('correct');
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({ kind: 'correct', x: 70, y: 140, size: 100 });
    emitLearningEffect('correct', document.querySelectorAll('button')[1]);
    expect(messages).toHaveLength(2); // distinct answer is never dropped
  });
  it('clips a finger trail to the visible activity bounds and retains screen coordinates', () => {
    emitLearningEffect('trace', target, { x: 110, y: 170 });
    expect(messages[0]).toMatchObject({
      kind: 'trace',
      x: 110,
      y: 170,
      bounds: { x: 20, y: 80, width: 400, height: 400 },
    });
  });
  it('anchors completion to its actual badge and suppresses a duplicate generic praise after letter completion', () => {
    emitLearningEffect('complete', target);
    expect(messages[0]).toMatchObject({ kind: 'complete', x: 70, y: 140 });
    emitLearningEffect('letter', target);
    emitLearningEffect('correct', target);
    expect(
      messages.map((message) => (typeof message === 'string' ? message : message.kind))
    ).toEqual(['complete', 'letter']);
  });
  it('cycles three distinct correct scenes and resets the sequence on exit', () => {
    for (let i = 0; i < 3; i++) {
      const answer = document.createElement('button');
      target.parentElement!.append(answer);
      emitLearningEffect('correct', answer);
    }
    expect(messages.filter((m) => typeof m !== 'string').map((m) => m.variant)).toEqual([0, 1, 2]);
    clearLearningEffects();
    emitLearningEffect('correct', target);
    expect(messages.at(-1)).toMatchObject({ variant: 0 });
  });
  it('does not load/render animated effects for reduced motion or embedded previews', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));
    emitLearningEffect('correct', target);
    expect(messages).toHaveLength(0);
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
    target.parentElement!.dataset.effectsEmbedded = 'true';
    emitLearningEffect('tap', target);
    expect(messages).toHaveLength(0);
  });
  it('forgets removed targets and resets the duplicate guard when leaving an activity', () => {
    rememberLearningTarget(target);
    emitLearningEffect('correct');
    clearLearningEffects();
    emitLearningEffect('correct', target);
    expect(messages.map((m) => (typeof m === 'string' ? m : m.kind))).toEqual([
      'correct',
      'clear',
      'correct',
    ]);
    target.remove();
    emitLearningEffect('retry');
    expect(messages.at(-1)).toMatchObject({ kind: 'retry', x: 220, y: 280 });
  });
});
