import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type DragEvent,
  type MouseEvent,
  type KeyboardEvent,
} from 'react';

/** Native touch inertia and wheel scrolling; mouse users can also grab the map. */
export function usePathCamera() {
  const viewport = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; x: number; left: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const [position, setPosition] = useState<number | null>(null);
  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setPosition(el.scrollLeft));
    };
    el.addEventListener('scroll', update, { passive: true });
    // A normal mouse wheel explores the horizontal path too. Native horizontal touch/trackpad stays native.
    const wheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) >= Math.abs(event.deltaY) || event.ctrlKey) return;
      const delta =
        event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? el.clientWidth : 1);
      const next = Math.max(0, Math.min(el.scrollWidth - el.clientWidth, el.scrollLeft + delta));
      if (next === el.scrollLeft) return;
      event.preventDefault();
      el.scrollLeft = next;
    };
    el.addEventListener('wheel', wheel, { passive: false });
    update();
    return () => {
      el.removeEventListener('scroll', update);
      el.removeEventListener('wheel', wheel);
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
      left: (direction * el.clientWidth) / 3,
      behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  };
  return {
    viewport,
    position,
    pan,
    handlers: {
      onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.target !== e.currentTarget || !['Home', 'End'].includes(e.key)) return;
        e.preventDefault();
        e.currentTarget.scrollLeft =
          e.key === 'Home' ? 0 : e.currentTarget.scrollWidth - e.currentTarget.clientWidth;
      },
      onPointerDown: (e: PointerEvent<HTMLDivElement>) => {
        suppressClick.current = false;
        if (e.pointerType !== 'mouse' || e.button !== 0) return;
        drag.current = {
          id: e.pointerId,
          x: e.clientX,
          left: e.currentTarget.scrollLeft,
          moved: false,
        };
      },
      onPointerMove: (e: PointerEvent<HTMLDivElement>) => {
        const state = drag.current;
        if (!state || state.id !== e.pointerId) return;
        const delta = e.clientX - state.x;
        if (!state.moved && Math.abs(delta) < 8) return;
        state.moved = true;
        e.currentTarget.setPointerCapture?.(e.pointerId);
        e.currentTarget.classList.add('is-dragging');
        e.currentTarget.scrollLeft = state.left - delta;
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
