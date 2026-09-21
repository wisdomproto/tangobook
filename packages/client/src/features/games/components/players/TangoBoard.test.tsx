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
});
