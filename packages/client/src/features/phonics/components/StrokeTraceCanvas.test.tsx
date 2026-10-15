import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StrokeTraceCanvas } from './StrokeTraceCanvas';
vi.mock('@/lib/uiSound', () => ({ feedDrawLoop: vi.fn(), playUi: vi.fn() }));
vi.mock('@/features/games/effects/learning-effects', () => ({ emitLearningEffect: vi.fn() }));
vi.mock('./letter-stroke-guide', () => ({
  getLetterGuideStrokes: () => [
    { from: { x: 120, y: 60 }, to: { x: 120, y: 330 } },
    { from: { x: 120, y: 190 }, to: { x: 230, y: 190 } },
  ],
}));
const fonts = Object.getOwnPropertyDescriptor(document, 'fonts');
const mask = () => {
  const data = new Uint8ClampedArray(400 * 400 * 4);
  for (let y = 60; y < 331; y++) for (let x = 110; x < 130; x++) data[(y * 400 + x) * 4 + 3] = 255;
  return { data, width: 400, height: 400 };
};
beforeEach(() => {
  vi.stubGlobal(
    'PointerEvent',
    class extends MouseEvent {
      pointerId: number;
      constructor(
        type: string,
        options: { pointerId?: number; clientX?: number; clientY?: number } = {}
      ) {
        super(type, options);
        this.pointerId = options.pointerId ?? 1;
      }
    }
  );
  Reflect.deleteProperty(document, 'fonts');
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    clearRect: vi.fn(),
    fillText: vi.fn(),
    measureText: () => ({ width: 250 }),
    getImageData: mask,
    createImageData: () => ({ data: new Uint8ClampedArray(400 * 400 * 4) }),
    putImageData: vi.fn(),
  } as unknown as CanvasRenderingContext2D);
  HTMLCanvasElement.prototype.setPointerCapture = vi.fn();
  HTMLCanvasElement.prototype.hasPointerCapture = () => false;
  vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue({
    left: 0,
    top: 0,
    width: 400,
    height: 400,
  } as DOMRect);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  if (fonts) Object.defineProperty(document, 'fonts', fonts);
  else Reflect.deleteProperty(document, 'fonts');
});
function gesture(canvas: HTMLElement, from: number[], to: number[], cancel = false) {
  fireEvent.pointerDown(canvas, { pointerId: 1, clientX: from[0], clientY: from[1] });
  fireEvent.pointerMove(canvas, { pointerId: 1, clientX: to[0], clientY: to[1] });
  (cancel ? fireEvent.pointerCancel : fireEvent.pointerUp)(canvas, {
    pointerId: 1,
    clientX: to[0],
    clientY: to[1],
  });
}
describe('실제 획 순서와 완료 배선', () => {
  it('시범/다시 보기·가로획 먼저·취소로 완료되지 않고, 두 획을 그어야 한번 완료한다', () => {
    const result = vi.fn();
    render(<StrokeTraceCanvas letter="ㅏ" guidance="demo" onResult={result} />);
    const paper = screen.getByLabelText('ㅏ 따라쓰기');
    fireEvent.click(screen.getByRole('button', { name: '쓰는 순서' }));
    expect(result).not.toHaveBeenCalled();
    gesture(paper, [160, 190], [230, 190]);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    gesture(paper, [120, 60], [120, 330], true);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    gesture(paper, [110, 65], [132, 325]);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
    expect(result).not.toHaveBeenCalled();
    gesture(paper, [120, 190], [230, 200]);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '2');
    expect(result).toHaveBeenCalledExactlyOnceWith(true, 1);
    gesture(paper, [120, 60], [120, 330]);
    expect(result).toHaveBeenCalledTimes(1);
  });
  it('폰트가 늦게 도착하면 준비 전 입력은 무시하고 이탈 후 다시 그리지 않는다', async () => {
    let resolve!: () => void;
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: {
        load: () =>
          new Promise<void>((r) => {
            resolve = r;
          }),
      },
    });
    const result = vi.fn();
    const { unmount } = render(<StrokeTraceCanvas letter="ㅏ" guidance="hint" onResult={result} />);
    gesture(screen.getByLabelText('ㅏ 따라쓰기'), [120, 60], [120, 330]);
    expect(result).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '쓰는 순서' })).toBeDisabled();
    unmount();
    await act(async () => resolve());
    expect(result).not.toHaveBeenCalled();
  });
  it('독립 연습은 획순 그림 없이 같은 경로를 검사하며 성공 전 입력은 다음 획을 열지 않는다', async () => {
    const { container } = render(
      <StrokeTraceCanvas letter="ㅏ" guidance="independent" onResult={vi.fn()} />
    );
    expect(container.querySelector('[data-stroke-overlay]')).toBeNull();
    const paper = screen.getByLabelText('ㅏ 따라쓰기');
    gesture(paper, [120, 60], [120, 120]);
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('시작점에서 다시'));
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });
});
