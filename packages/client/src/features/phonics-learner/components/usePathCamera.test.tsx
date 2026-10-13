import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { Link, MemoryRouter, useLocation } from 'react-router-dom';
import { usePathCamera } from './usePathCamera';

function Camera() {
  const { viewport, handlers, pan } = usePathCamera();
  const location = useLocation();
  return (
    <>
      <div ref={viewport} {...handlers} role="region" aria-label="Map">
        <Link to="/chapter">Chapter</Link>
      </div>
      <button onClick={() => pan(1)}>Pan</button>
      <output>{location.pathname}</output>
    </>
  );
}
function pointer(node: HTMLElement, name: string, y: number, type = 'mouse') {
  const event = new Event(name, { bubbles: true });
  Object.assign(event, { pointerId: 1, pointerType: type, button: 0, clientY: y });
  fireEvent(node, event);
}
function setup() {
  render(
    <MemoryRouter>
      <Camera />
    </MemoryRouter>
  );
  return screen.getByRole('region', { name: 'Map' });
}
it('pans by mouse drag and suppresses the following mouse click, while a fresh tap opens the chapter', () => {
  const map = setup();
  pointer(map, 'pointerdown', 300);
  pointer(map, 'pointermove', 150);
  expect(map.scrollTop).toBe(150);
  pointer(map, 'pointerup', 150);
  fireEvent.click(screen.getByRole('link'), { detail: 1 });
  expect(screen.getByRole('status').textContent).toBe('/');
  pointer(map, 'pointerdown', 150);
  pointer(map, 'pointermove', 153);
  pointer(map, 'pointerup', 153);
  fireEvent.click(screen.getByRole('link'), { detail: 1 });
  expect(screen.getByRole('status').textContent).toBe('/chapter');
});
it('leaves touch scrolling to the browser and keeps keyboard activation available after dragging', () => {
  const map = setup();
  pointer(map, 'pointerdown', 300, 'touch');
  pointer(map, 'pointermove', 150, 'touch');
  expect(map.scrollTop).toBe(0);
  pointer(map, 'pointerdown', 300);
  pointer(map, 'pointermove', 150);
  pointer(map, 'pointerup', 150);
  fireEvent.click(screen.getByRole('link'), { detail: 0 });
  expect(screen.getByRole('status').textContent).toBe('/chapter');
});
it('moves by a viewport-relative distance with reduced-motion support', () => {
  const original = window.matchMedia;
  window.matchMedia = vi.fn(() => ({ matches: true })) as unknown as typeof window.matchMedia;
  try {
    const map = setup();
    Object.defineProperty(map, 'clientHeight', { value: 600 });
    map.scrollBy = vi.fn();
    fireEvent.click(screen.getByRole('button', { name: 'Pan' }));
    expect(map.scrollBy).toHaveBeenCalledWith({ top: 360, behavior: 'auto' });
  } finally {
    window.matchMedia = original;
  }
});
