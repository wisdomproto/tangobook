import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TangoBoard } from './TangoBoard';

describe('TangoBoard drag preview', () => {
  it('renders at viewport pointer coordinates outside a transformed container', () => {
    const { getByRole } = render(
      <div style={{ transform: 'scale(0.5)', transformOrigin: 'top left' }}>
        <TangoBoard
          placed={[]}
          picked={null}
          onPick={vi.fn()}
          onPlace={vi.fn()}
          onMovePlaced={vi.fn()}
          onRemovePlaced={vi.fn()}
          onRotatePlaced={vi.fn()}
        />
      </div>
    );

    const piece = getByRole('button', { name: 'ㄱ 고르기' });
    Object.defineProperty(piece, 'setPointerCapture', { value: vi.fn() });
    const pointerEvent = (type: string, clientX: number, clientY: number) => {
      const event = new Event(type, { bubbles: true });
      Object.defineProperties(event, {
        pointerId: { value: 1 },
        clientX: { value: clientX },
        clientY: { value: clientY },
      });
      return event;
    };
    fireEvent(piece, pointerEvent('pointerdown', 60, 80));
    fireEvent(piece, pointerEvent('pointermove', 240, 180));

    const preview = document.querySelector<HTMLElement>('[data-tango-drag-preview]');
    expect(preview).not.toBeNull();
    expect(preview?.parentElement).toBe(document.body);
    expect(preview?.style.left).toBe('240px');
    expect(preview?.style.top).toBe('180px');
  });

  it('rotates a placed block on click and removes it when dropped outside the board', () => {
    const onRotatePlaced = vi.fn();
    const onRemovePlaced = vi.fn();
    const { getByRole, container } = render(
      <TangoBoard
        placed={[{ uid: 7, id: 0, rotDeg: 0, x: 2, y: 2 }]}
        picked={null}
        onPick={vi.fn()}
        onPlace={vi.fn()}
        onMovePlaced={vi.fn()}
        onRemovePlaced={onRemovePlaced}
        onRotatePlaced={onRotatePlaced}
      />
    );

    const placedBlock = getByRole('button', { name: /ㄱ 블록/ });
    Object.defineProperty(placedBlock, 'setPointerCapture', { value: vi.fn() });
    fireEvent.click(placedBlock);
    expect(onRotatePlaced).toHaveBeenCalledWith(7);

    const board = container.querySelector<SVGSVGElement>('svg[viewBox="0 0 24 8"]')!;
    vi.spyOn(board, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      right: 240,
      bottom: 80,
      width: 240,
      height: 80,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    const pointerEvent = (type: string, clientX: number, clientY: number) => {
      const event = new Event(type, { bubbles: true });
      Object.defineProperties(event, {
        pointerId: { value: 1 },
        clientX: { value: clientX },
        clientY: { value: clientY },
      });
      return event;
    };
    fireEvent(placedBlock, pointerEvent('pointerdown', 40, 30));
    fireEvent(placedBlock, pointerEvent('pointermove', 300, 120));
    fireEvent(placedBlock, pointerEvent('pointerup', 300, 120));

    expect(onRemovePlaced).toHaveBeenCalledWith(7);
  });
});
