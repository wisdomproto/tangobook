import { act, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WordFillCanvas } from './WordFillCanvas';

vi.mock('@/features/games/effects/learning-effects', () => ({ emitLearningEffect: vi.fn() }));
vi.mock('@/lib/uiSound', () => ({ feedDrawLoop: vi.fn() }));

let painted = false;
let frame: ((at: number) => void) | undefined;
const readImage = () => {
  const data = new Uint8ClampedArray(720 * 360 * 4);
  for (const x of [300, 400]) data.set(painted ? [16, 185, 129, 255] : [229, 231, 235, 255], x * 4);
  return { data };
};
const ctx = {
  clearRect: vi.fn(),
  fillText: vi.fn(),
  measureText: (text: string) => ({ width: text.length * 100 }),
  save: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  putImageData: vi.fn((_image: { data: Uint8ClampedArray }, _x: number, _y: number) => {}),
  getImageData: vi.fn(readImage),
};

beforeEach(() => {
  painted = false;
  frame = undefined;
  ctx.getImageData.mockImplementation(readImage);
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    ctx as unknown as CanvasRenderingContext2D
  );
  vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue({
    left: 0,
    top: 0,
    width: 720,
    height: 360,
  } as DOMRect);
  HTMLCanvasElement.prototype.setPointerCapture = vi.fn();
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn((fn: (at: number) => void) => {
      frame = fn;
      return 1;
    })
  );
  vi.stubGlobal(
    'cancelAnimationFrame',
    vi.fn(() => {
      frame = undefined;
    })
  );
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('낱말 쓰기 채점 빈도', () => {
  it('연속 move는 즉시 그리지만 프레임당 한 번만 채점하고, pointerup은 바로 확정한다', async () => {
    const complete = vi.fn();
    const view = render(
      <WordFillCanvas word="aa" syllables={['a', 'a']} sequential={false} onComplete={complete} />
    );
    await act(async () => {});
    const canvas = view.container.querySelector('canvas')!;
    fireEvent.pointerDown(canvas);
    const reads = ctx.getImageData.mock.calls.length;
    for (let i = 0; i < 8; i++) fireEvent.pointerMove(canvas);
    expect(ctx.stroke).toHaveBeenCalledTimes(8);
    expect(ctx.getImageData).toHaveBeenCalledTimes(reads);
    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
    act(() => frame?.(0));
    expect(ctx.getImageData).toHaveBeenCalledTimes(reads + 1);
    painted = true;
    fireEvent.pointerMove(canvas);
    fireEvent.pointerUp(canvas);
    expect(complete).toHaveBeenCalledTimes(1);
    expect(frame).toBeUndefined();
    fireEvent.pointerUp(canvas);
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it('낱말 교체·이탈 시 예약 채점을 취소하고 새 낱말은 다시 완료할 수 있다', async () => {
    const complete = vi.fn();
    const view = render(
      <WordFillCanvas word="aa" syllables={['a', 'a']} sequential={false} onComplete={complete} />
    );
    await act(async () => {});
    let canvas = view.container.querySelector('canvas')!;
    fireEvent.pointerDown(canvas);
    painted = true;
    fireEvent.pointerUp(canvas);
    expect(complete).toHaveBeenCalledTimes(1);
    painted = false;
    view.rerender(
      <WordFillCanvas word="bb" syllables={['b', 'b']} sequential={false} onComplete={complete} />
    );
    await act(async () => {});
    canvas = view.container.querySelector('canvas')!;
    fireEvent.pointerDown(canvas);
    painted = true;
    fireEvent.pointerMove(canvas);
    fireEvent.pointerUp(canvas);
    expect(complete).toHaveBeenCalledTimes(2);
    fireEvent.pointerDown(canvas);
    fireEvent.pointerMove(canvas);
    view.unmount();
    expect(frame).toBeUndefined();
  });
});

it('revealing future guides preserves ink, current cell and completion state', async () => {
  const syllables = ['a', 'b'];
  const complete = vi.fn();
  const view = render(<WordFillCanvas word="ab" syllables={syllables} onComplete={complete} />);
  await act(async () => {});
  const canvas = view.container.querySelector('canvas')!;
  fireEvent.pointerDown(canvas);
  fireEvent.pointerUp(canvas);
  const clears = ctx.clearRect.mock.calls.length;
  view.rerender(
    <WordFillCanvas word="ab" syllables={syllables} onComplete={complete} showAllGuides />
  );
  await act(async () => {});
  expect(view.container.querySelector('canvas')).toBe(canvas);
  expect(ctx.clearRect).toHaveBeenCalledTimes(clears);
  expect(complete).not.toHaveBeenCalled();
  expect(ctx.clip).toHaveBeenCalled();
});

it('완성한 칸만 매끈하게 채우고 같은 드래그로 다음 칸을 쓰지 않는다', async () => {
  let firstDone = false;
  ctx.getImageData.mockImplementation(() => {
    const data = new Uint8ClampedArray(720 * 360 * 4);
    data.set(firstDone ? [16, 185, 129, 255] : [229, 231, 235, 255], 300 * 4);
    data.set([229, 231, 235, 255], 400 * 4);
    return { data };
  });
  const onSyllableDone = vi.fn();
  const complete = vi.fn();
  const view = render(
    <WordFillCanvas
      word="ab"
      syllables={['a', 'b']}
      onSyllableDone={onSyllableDone}
      onComplete={complete}
    />
  );
  await act(async () => {});
  const canvas = view.container.querySelector('canvas')!;
  fireEvent.pointerDown(canvas);
  firstDone = true;
  fireEvent.pointerMove(canvas);
  act(() => frame?.(0));
  expect(onSyllableDone).toHaveBeenCalledWith('a', 0);
  expect(ctx.putImageData).toHaveBeenCalledTimes(1);
  const written = ctx.putImageData.mock.calls[0][0] as { data: Uint8ClampedArray };
  expect([...written.data.slice(400 * 4, 400 * 4 + 4)]).toEqual([229, 231, 235, 255]);
  const strokes = ctx.stroke.mock.calls.length;
  fireEvent.pointerMove(canvas);
  expect(ctx.stroke).toHaveBeenCalledTimes(strokes);
  fireEvent.pointerUp(canvas);
  fireEvent.pointerDown(canvas);
  fireEvent.pointerMove(canvas);
  expect(ctx.stroke).toHaveBeenCalledTimes(strokes + 1);
  expect(complete).not.toHaveBeenCalled();
});

it('영어 라임 우선 순서를 지키며 한 번에 한 칸만 확정한다', async () => {
  const done = vi.fn();
  const complete = vi.fn();
  const view = render(
    <WordFillCanvas
      word="ab"
      syllables={['a', 'b']}
      order={[1, 0]}
      onSyllableDone={done}
      onComplete={complete}
    />
  );
  await act(async () => {});
  const canvas = view.container.querySelector('canvas')!;
  fireEvent.pointerDown(canvas);
  painted = true;
  fireEvent.pointerUp(canvas);
  expect(done).toHaveBeenCalledExactlyOnceWith('b', 1);
  expect(complete).not.toHaveBeenCalled();
  fireEvent.pointerDown(canvas);
  fireEvent.pointerUp(canvas);
  expect(complete).toHaveBeenCalledTimes(1);
});
