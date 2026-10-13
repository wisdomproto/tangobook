import { act, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LearningEffectsHost } from './LearningEffectsHost';
import {
  clearLearningEffects,
  emitLearningEffect,
  prepareLearningEffects,
} from './learning-effects';

const mocks = vi.hoisted(() => ({
  play: vi.fn(),
  clear: vi.fn(),
  resize: vi.fn(),
  destroy: vi.fn(),
  create: vi.fn(),
}));
vi.mock('./learning-effects-engine', () => ({ createLearningEffectsEngine: mocks.create }));
vi.mock('@/lib/uiSound', () => ({ playUi: vi.fn() }));
const renderer = {
  play: mocks.play,
  clear: mocks.clear,
  resize: mocks.resize,
  destroy: mocks.destroy,
};
async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe('LearningEffectsHost lifetime', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearLearningEffects();
    mocks.create.mockResolvedValue(renderer);
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })
    );
  });
  afterEach(() => {
    clearLearningEffects();
    vi.unstubAllGlobals();
  });
  it('prepares lazily, clears on resize/exit, and destroys the one renderer on unmount', async () => {
    const view = render(
      <>
        <LearningEffectsHost />
        <section className="learning-stage">
          <button data-learning-fx="tap">가</button>
        </section>
      </>
    );
    expect(mocks.create).not.toHaveBeenCalled();
    prepareLearningEffects();
    await settle();
    expect(mocks.create).toHaveBeenCalledOnce();
    fireEvent.pointerDown(view.getByText('가'));
    // jsdom has empty geometry; explicitly give the stage a visible box.
    const rect = {
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 300,
      bottom: 300,
      width: 300,
      height: 300,
      toJSON: () => ({}),
    };
    vi.spyOn(view.getByText('가').parentElement!, 'getBoundingClientRect').mockReturnValue(rect);
    emitLearningEffect('correct', view.getByText('가'));
    expect(mocks.play).toHaveBeenCalledWith(expect.objectContaining({ kind: 'correct' }));
    fireEvent(window, new Event('resize'));
    expect(mocks.resize).toHaveBeenCalledOnce();
    clearLearningEffects();
    expect(mocks.clear).toHaveBeenCalled();
    view.unmount();
    expect(mocks.destroy).toHaveBeenCalledOnce();
    prepareLearningEffects();
    expect(mocks.create).toHaveBeenCalledOnce();
  });
  it('destroys a renderer whose async initialization finishes after unmount', async () => {
    let finish!: (value: typeof renderer) => void;
    mocks.create.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    );
    const view = render(<LearningEffectsHost />);
    prepareLearningEffects();
    await settle();
    view.unmount();
    await act(async () => {
      finish(renderer);
    });
    expect(mocks.destroy).toHaveBeenCalledOnce();
    expect(mocks.play).not.toHaveBeenCalled();
  });
  it('keeps the layer inert and skips the engine entirely with reduced motion', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi
        .fn()
        .mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })
    );
    const view = render(<LearningEffectsHost />);
    prepareLearningEffects();
    await settle();
    expect(mocks.create).not.toHaveBeenCalled();
    expect(view.container.firstChild).toHaveAttribute('aria-hidden', 'true');
    view.unmount();
  });
});
