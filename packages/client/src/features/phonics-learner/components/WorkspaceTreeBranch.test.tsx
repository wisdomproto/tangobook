import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { WorkspaceTreeBranch } from './WorkspaceTreeBranch';

afterEach(() => vi.restoreAllMocks());
it.each([
  [280, 200, 188],
  [240, 700, 232],
  [40, 100, 0],
])(
  'opening an overflowing branch at %s reveals its heading and activities within the list',
  (top, height, delta) => {
    let frame: (timestamp: number) => void = () => {};
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      frame = cb;
      return 1;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
    const { container } = render(
      <ol className="journey-chapter-activities">
        <WorkspaceTreeBranch
          title="놀며 익히기"
          kind="section"
          defaultOpen={false}
          followKey="chapter"
        >
          <li>게임</li>
        </WorkspaceTreeBranch>
      </ol>
    );
    const list = container.firstElementChild as HTMLElement;
    Object.defineProperty(list, 'clientHeight', { value: 300 });
    list.getBoundingClientRect = () => ({ top: 0, bottom: 300 }) as DOMRect;
    container.querySelector('li')!.getBoundingClientRect = () =>
      ({ top, bottom: top + height, height }) as DOMRect;
    const scroll = vi.fn();
    list.scrollBy = scroll;
    expect(scroll).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '놀며 익히기' }));
    act(() => frame(0));
    if (delta) expect(scroll).toHaveBeenCalledWith({ top: delta, behavior: 'smooth' });
    else expect(scroll).not.toHaveBeenCalled();
    scroll.mockClear();
    fireEvent.click(screen.getByRole('button', { name: '놀며 익히기' }));
    expect(scroll).not.toHaveBeenCalled();
  }
);
