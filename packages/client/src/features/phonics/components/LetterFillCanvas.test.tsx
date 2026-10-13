import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LetterFillCanvas } from './LetterFillCanvas';

const reduced = vi.hoisted(() => ({ value: false }));
vi.mock('framer-motion', async (original) => ({
  ...(await original<typeof import('framer-motion')>()),
  useReducedMotion: () => reduced.value,
}));
vi.mock('@/features/games/effects/learning-effects', () => ({ emitLearningEffect: vi.fn() }));
vi.mock('@/lib/uiSound', () => ({ feedDrawLoop: vi.fn() }));

function mask(paintedFraction = 0) {
  const data = new Uint8ClampedArray(400 * 400 * 4);
  const ink: number[] = [];
  for (let y = 60; y <= 300; y++) {
    for (let x = 120; x <= 225; x++) {
      if (x <= 140 || (y >= 160 && y <= 180)) ink.push((y * 400 + x) * 4);
    }
  }
  ink.forEach((index, i) =>
    data.set(
      i < Math.floor(ink.length * paintedFraction) ? [16, 185, 129, 255] : [229, 231, 235, 255],
      index
    )
  );
  return { data, width: 400, height: 400 };
}

let fraction = 0;
let canvasContext: Record<string, unknown>;
const nativeFonts = Object.getOwnPropertyDescriptor(document, 'fonts');
beforeEach(() => {
  vi.useFakeTimers();
  reduced.value = false;
  fraction = 0;
  canvasContext = {
    measureText: () => ({ width: 250 }),
    clearRect: vi.fn(),
    fillText: vi.fn(),
    getImageData: () => mask(fraction),
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
  };
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    canvasContext as unknown as CanvasRenderingContext2D
  );
  HTMLCanvasElement.prototype.setPointerCapture = vi.fn();
  vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    width: 400,
    height: 400,
    right: 400,
    bottom: 400,
    toJSON: () => ({}),
  });
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  if (nativeFonts) Object.defineProperty(document, 'fonts', nativeFonts);
  else Reflect.deleteProperty(document, 'fonts');
});

describe('vowel hints preserve the actual writing result', () => {
  it('automatically guides Korean consonants and English letters without adding tools below the paper', () => {
    const { container, rerender } = render(<LetterFillCanvas letter="ㄱ" autoCheck />);
    expect(container.querySelector('[data-stroke-overlay="hint"]')).not.toBeNull();
    expect(
      screen.getByRole('button', { name: '쓰는 순서' }).closest('.letter-fill-paper')
    ).not.toBeNull();
    expect(container.querySelector('.vowel-stroke-tools')).toBeNull();
    rerender(<LetterFillCanvas letter="A" autoCheck />);
    expect(container.querySelector('[data-stroke-overlay="hint"]')).not.toBeNull();
    rerender(<LetterFillCanvas letter="A" guidance="none" autoCheck />);
    expect(container.querySelector('[data-stroke-overlay]')).toBeNull();
  });
  it('the demo/replay never paints or completes, and touching immediately stops it', async () => {
    const result = vi.fn();
    const { container } = render(
      <LetterFillCanvas letter="ㅏ" guidance="demo" autoCheck onResult={result} />
    );
    expect(screen.getByRole('status')).toHaveTextContent('쓰는 순서를 봐요');
    await act(async () => vi.advanceTimersByTime(2250));
    expect(screen.getByRole('status')).toHaveTextContent('점에서 시작해요');
    expect(result).not.toHaveBeenCalled();
    expect(canvasContext.stroke).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '쓰는 순서' }));
    expect(container.querySelector('[data-stroke-overlay="demo"]')).not.toBeNull();
    fireEvent.pointerDown(container.querySelector('canvas')!, { clientX: 130, clientY: 70 });
    fireEvent.pointerUp(container.querySelector('canvas')!);
    expect(container.querySelector('[data-stroke-overlay="hint"]')).not.toBeNull();
    expect(result).not.toHaveBeenCalled();
  });
  it('keeps the 99% threshold, including in independent practice', () => {
    const result = vi.fn();
    const { container } = render(
      <LetterFillCanvas letter="ㅏ" guidance="independent" autoCheck onResult={result} />
    );
    expect(container.querySelector('[data-stroke-overlay]')).toBeNull();
    expect(canvasContext.fillStyle).toBe('#eeeae2');
    const canvas = container.querySelector('canvas')!;
    fraction = 0.98;
    fireEvent.pointerDown(canvas, { clientX: 130, clientY: 70 });
    fireEvent.pointerUp(canvas);
    expect(result).not.toHaveBeenCalled();
    fraction = 1;
    fireEvent.pointerDown(canvas, { clientX: 130, clientY: 70 });
    fireEvent.pointerUp(canvas);
    expect(result).toHaveBeenCalledExactlyOnceWith(true, 1);
    expect(screen.getByRole('button', { name: '쓰는 순서' })).toBeDisabled();
  });
  it('waits for the font, cancels initialization on exit, and handles font failure', async () => {
    let finish!: () => void;
    const load = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        })
    );
    Object.defineProperty(document, 'fonts', { configurable: true, value: { load } });
    const { container, unmount } = render(
      <LetterFillCanvas letter="ㅏ" guidance="demo" autoCheck />
    );
    expect(screen.getByRole('status')).toHaveTextContent('글자를 준비해요');
    fireEvent.pointerDown(container.querySelector('canvas')!, { clientX: 130, clientY: 70 });
    expect(canvasContext.fillText).not.toHaveBeenCalled();
    unmount();
    await act(async () => finish());
    expect(canvasContext.fillText).not.toHaveBeenCalled();
    load.mockImplementation(() => Promise.reject(new Error('offline font')));
    render(<LetterFillCanvas letter="ㅏ" guidance="hint" autoCheck />);
    await act(async () => {});
    expect(canvasContext.fillText).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status')).toHaveTextContent('점에서 시작해요');
  });
  it('reduced motion uses a static start/direction instead of waiting for a demo', () => {
    reduced.value = true;
    const { container } = render(<LetterFillCanvas letter="ㅏ" guidance="demo" autoCheck />);
    expect(screen.getByRole('status')).toHaveTextContent('점에서 시작해요');
    expect(container.querySelector('[data-stroke-overlay="hint"]')).not.toBeNull();
  });
});
