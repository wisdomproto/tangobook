import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type DragEvent,
  type MouseEvent,
} from 'react';

/** Native touch inertia and wheel scrolling; mouse users can also grab the map. */
export function usePathCamera() {
  const viewport = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; y: number; top: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const [position, setPosition] = useState<number | null>(null);
  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setPosition(el.scrollTop));
    };
    el.addEventListener('scroll', update, { passive: true });
    update();
    return () => {
      el.removeEventListener('scroll', update);
      cancelAnimationFrame(frame);
    };
  });
  const endDrag = (e: PointerEvent<HTMLDivElement>) => {
    if (drag.current?.id !== e.pointerId) return;
    suppressClick.current = drag.current.moved;
    drag.current = null;
    if (e.currentTarget.hasPointerCapture?.(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
    e.currentTarget.classList.remove('is-dragging');
  };
  const pan = (direction: number) => {
    const el = viewport.current;
    if (!el) return;
    el.scrollBy({
      top: direction * el.clientHeight * 0.6,
      behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  };
  return {
    viewport,
    position,
    pan,
    handlers: {
      onPointerDown: (e: PointerEvent<HTMLDivElement>) => {
        suppressClick.current = false;
        if (e.pointerType !== 'mouse' || e.button !== 0) return;
        drag.current = {
          id: e.pointerId,
          y: e.clientY,
          top: e.currentTarget.scrollTop,
          moved: false,
        };
      },
      onPointerMove: (e: PointerEvent<HTMLDivElement>) => {
        const state = drag.current;
        if (!state || state.id !== e.pointerId) return;
        const delta = e.clientY - state.y;
        if (!state.moved && Math.abs(delta) < 8) return;
        state.moved = true;
        e.currentTarget.setPointerCapture?.(e.pointerId);
        e.currentTarget.classList.add('is-dragging');
        e.currentTarget.scrollTop = state.top - delta;
      },
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
      onDragStart: (e: DragEvent<HTMLDivElement>) => e.preventDefault(),
      onClickCapture: (e: MouseEvent<HTMLDivElement>) => {
        if (!suppressClick.current || e.detail === 0) return;
        e.preventDefault();
        e.stopPropagation();
        suppressClick.current = false;
      },
    },
  };
}
