import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { blockIndexOf } from '../../lib/tango-board/blocks';
import { TangoBoard, canPlace, findNearestPlacement } from './TangoBoard';

describe('TangoBoard drag preview', () => {
  it('does not render a small floating block while dragging', () => {
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

    expect(document.querySelector('[data-tango-drag-preview]')).toBeNull();
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

    const deleteHint = document.querySelector<HTMLElement>('[data-tango-delete-hint]');
    expect(deleteHint?.parentElement).toBe(document.body);
    expect(deleteHint?.textContent).toBe('놓아서 삭제');

    fireEvent(placedBlock, pointerEvent('pointerup', 300, 120));

    expect(onRemovePlaced).toHaveBeenCalledWith(7);
  });

  it('keeps the grabbed point when moving a placed block by one cell', () => {
    const onMovePlaced = vi.fn();
    const { getByRole, container } = render(
      <TangoBoard
        placed={[{ uid: 7, id: 0, rotDeg: 0, x: 2, y: 2 }]}
        picked={null}
        onPick={vi.fn()}
        onPlace={vi.fn()}
        onMovePlaced={onMovePlaced}
        onRemovePlaced={vi.fn()}
        onRotatePlaced={vi.fn()}
      />
    );

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
    Object.defineProperty(board, 'getScreenCTM', {
      value: () => ({ inverse: () => ({}) }),
    });
    Object.defineProperty(board, 'createSVGPoint', {
      value: () => {
        const point = {
          x: 0,
          y: 0,
          matrixTransform: () => ({ x: point.x / 10, y: point.y / 10 }),
        };
        return point;
      },
    });

    const placedBlock = getByRole('button', { name: /ㄱ 블록/ });
    Object.defineProperty(placedBlock, 'setPointerCapture', { value: vi.fn() });
    const pointerEvent = (type: string, clientX: number, clientY: number) => {
      const event = new Event(type, { bubbles: true });
      Object.defineProperties(event, {
        pointerId: { value: 1 },
        clientX: { value: clientX },
        clientY: { value: clientY },
      });
      return event;
    };
    fireEvent(placedBlock, pointerEvent('pointerdown', 35, 35));
    fireEvent(placedBlock, pointerEvent('pointermove', 45, 35));

    const dropPreview = container.querySelector<SVGGElement>('[data-tango-drop-preview]');
    expect(dropPreview?.getAttribute('transform')).toBe('translate(3 2)');
    expect(dropPreview?.dataset.valid).toBe('true');

    fireEvent(placedBlock, pointerEvent('pointerup', 45, 35));

    expect(onMovePlaced).toHaveBeenCalledWith(7, 3, 2);
  });

  it('treats small pointer jitter as a rotation click', () => {
    const onMovePlaced = vi.fn();
    const onRotatePlaced = vi.fn();
    const { getByRole } = render(
      <TangoBoard
        placed={[{ uid: 7, id: 0, rotDeg: 0, x: 2, y: 2 }]}
        picked={null}
        onPick={vi.fn()}
        onPlace={vi.fn()}
        onMovePlaced={onMovePlaced}
        onRemovePlaced={vi.fn()}
        onRotatePlaced={onRotatePlaced}
      />
    );

    const placedBlock = getByRole('button', { name: /ㄱ 블록/ });
    Object.defineProperty(placedBlock, 'setPointerCapture', { value: vi.fn() });
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
    fireEvent(placedBlock, pointerEvent('pointermove', 43, 33));
    fireEvent(placedBlock, pointerEvent('pointerup', 43, 33));
    fireEvent.click(placedBlock);

    expect(onMovePlaced).not.toHaveBeenCalled();
    expect(onRotatePlaced).toHaveBeenCalledWith(7);
  });

  it('finds the nearest open position when rotation is blocked', () => {
    const vowelId = blockIndexOf('ㅓ');
    const obstacle = { uid: 1, id: vowelId, rotDeg: 270, x: 8, y: 3 };
    const nearest = findNearestPlacement([obstacle], vowelId, 270, 8, 3);

    expect(nearest).not.toBeNull();
    expect(nearest).not.toEqual({ x: 8, y: 3 });
    expect(canPlace([obstacle], vowelId, 270, nearest!.x, nearest!.y)).toBe(true);
  });
});
