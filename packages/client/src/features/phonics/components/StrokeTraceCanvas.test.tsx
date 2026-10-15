import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StrokeTraceCanvas } from './StrokeTraceCanvas';
import { getLetterGuideStrokes } from './letter-stroke-guide';
import { makeTracePath } from './stroke-tracing';
import curveEnds from './__fixtures__/english-curve-ends.json';
vi.mock('@/lib/uiSound', () => ({ feedDrawLoop: vi.fn(), playUi: vi.fn() }));
vi.mock('@/features/games/effects/learning-effects', () => ({ emitLearningEffect: vi.fn() }));
vi.mock('./letter-stroke-guide', () => ({
  getLetterGuideStrokes: vi.fn((letter: string) =>
    letter === 'j'
      ? [
          {
            from: { x: 200, y: 100 },
            to: { x: 160, y: 300 },
            points: [
              { x: 200, y: 100 },
              { x: 200, y: 260 },
              { x: 195, y: 280 },
              { x: 180, y: 296 },
              { x: 160, y: 300 },
            ],
          },
          { from: { x: 200, y: 50 }, to: { x: 201, y: 50 }, dot: true },
        ]
      : letter === 'i'
        ? [
            { from: { x: 200, y: 100 }, to: { x: 200, y: 300 } },
            { from: { x: 200, y: 50 }, to: { x: 201, y: 50 }, dot: true },
          ]
        : [
            { from: { x: 120, y: 60 }, to: { x: 120, y: 330 } },
            { from: { x: 120, y: 190 }, to: { x: 230, y: 190 } },
          ]
  ),
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
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,ink');
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
  it('진행 잉크와 완료 빛은 각 획의 폰트 마스크 밖으로 번지지 않는다', () => {
    const { container } = render(
      <StrokeTraceCanvas letter="ㅏ" guidance="hint" onResult={vi.fn()} />
    );
    const paper = screen.getByLabelText('ㅏ 따라쓰기');
    fireEvent.pointerDown(paper, { pointerId: 1, clientX: 120, clientY: 60 });
    fireEvent.pointerMove(paper, { pointerId: 1, clientX: 120, clientY: 200 });
    const ink = container.querySelector('.stroke-trace-ink path')!;
    expect(ink.getAttribute('mask')).toMatch(/^url\(#.+-progress\)$/);
    expect(container.querySelector('.stroke-trace-ink mask image')).toHaveAttribute(
      'href',
      'data:image/png;base64,ink'
    );
    fireEvent.pointerUp(paper, { pointerId: 1, clientX: 120, clientY: 330 });
    expect(container.querySelector('.stroke-trace-ink')).toBeNull();
    expect(container.querySelector('.stroke-trace-flash path')!.getAttribute('mask')).toMatch(
      /^url\(#.+-flash\)$/
    );
  });
  it.each(Object.entries(curveEnds))(
    '%s의 흔들린 실제 곡선 완료가 다음 획을 열고, 취소/반쪽 입력은 열지 않는다',
    (letter, svg) => {
      const values = svg.match(/-?\d+(?:\.\d+)?/g)!.map(Number);
      const points = Array.from({ length: values.length / 2 }, (_, i) => ({
        x: values[i * 2],
        y: values[i * 2 + 1],
      }));
      const curve = { from: points[0], to: points.at(-1)!, points };
      vi.mocked(getLetterGuideStrokes).mockReturnValueOnce([
        curve,
        { from: { x: 300, y: 60 }, to: { x: 300, y: 300 } },
      ]);
      const result = vi.fn();
      render(<StrokeTraceCanvas letter={letter} guidance="hint" onResult={result} />);
      const paper = screen.getByLabelText(`${letter} 따라쓰기`);
      const input = makeTracePath(curve).points.map((p, i) => ({
        x: p.x + Math.sin(i * 0.25) * 12,
        y: p.y + Math.cos(i * 0.25) * 12,
      }));
      const draw = (cancel = false, half = false) => {
        const pts = half ? input.slice(0, Math.floor(input.length / 2)) : input;
        fireEvent.pointerDown(paper, { pointerId: 1, clientX: pts[0].x, clientY: pts[0].y });
        for (const p of pts.slice(1))
          fireEvent.pointerMove(paper, { pointerId: 1, clientX: p.x, clientY: p.y });
        (cancel ? fireEvent.pointerCancel : fireEvent.pointerUp)(paper, {
          pointerId: 1,
          clientX: pts.at(-1)!.x,
          clientY: pts.at(-1)!.y,
        });
      };
      draw(true);
      draw(false, true);
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
      draw();
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
      expect(result).not.toHaveBeenCalled();
      gesture(paper, [300, 60], [302, 298]);
      expect(result).toHaveBeenCalledExactlyOnceWith(true, 1);
    }
  );
  it.each(['i', 'j'])('%s 점 버튼은 몸통 뒤에만 열리고 실제 클릭 한 번만 완료한다', (letter) => {
    const result = vi.fn();
    render(<StrokeTraceCanvas letter={letter} guidance="hint" compact onResult={result} />);
    expect(screen.queryByRole('button', { name: `${letter} 점 찍기` })).not.toBeInTheDocument();
    const paper = screen.getByLabelText(`${letter} 따라쓰기`);
    if (letter === 'j') {
      fireEvent.pointerDown(paper, { pointerId: 1, clientX: 205, clientY: 104 });
      for (const [x, y] of [
        [205, 170],
        [195, 250],
        [200, 278],
        [183, 293],
        [163, 301],
      ])
        fireEvent.pointerMove(paper, { pointerId: 1, clientX: x, clientY: y });
      fireEvent.pointerUp(paper, { pointerId: 1, clientX: 163, clientY: 301 });
    } else gesture(paper, [200, 100], [203, 297]);
    const dot = screen.getByRole('button', { name: `${letter} 점 찍기` });
    expect(dot).toHaveTextContent('톡!');
    fireEvent.pointerDown(dot, { pointerId: 4 });
    fireEvent.pointerCancel(dot, { pointerId: 4 });
    expect(result).not.toHaveBeenCalled();
    fireEvent.click(dot);
    expect(result).toHaveBeenCalledExactlyOnceWith(true, 1);
    expect(screen.queryByRole('button', { name: `${letter} 점 찍기` })).not.toBeInTheDocument();
  });
  it('영어 i는 몸통을 먼저 쓴 뒤 점을 찍어야 완료하며 점찍기 취소는 인정하지 않는다', () => {
    const result = vi.fn();
    render(<StrokeTraceCanvas letter="i" guidance="hint" compact onResult={result} />);
    const paper = screen.getByLabelText('i 따라쓰기');
    gesture(paper, [200, 50], [200, 50]);
    expect(result).not.toHaveBeenCalled();
    gesture(paper, [200, 100], [205, 297]);
    expect(screen.getByRole('status')).toHaveTextContent('작은 점');
    gesture(paper, [203, 53], [203, 53], true);
    expect(result).not.toHaveBeenCalled();
    gesture(paper, [203, 53], [203, 53]);
    expect(result).toHaveBeenCalledExactlyOnceWith(true, 1);
    expect(screen.getByRole('button', { name: 'i 쓰는 순서' })).toBeDisabled();
  });
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
