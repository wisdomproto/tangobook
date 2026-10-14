import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { StorybookSprite } from '@/design-system/primitives/StorybookSprite';
import './tango-board.css';

export function EnglishAlphabetTray({
  children,
  letterCount,
}: {
  children: ReactNode;
  letterCount: number;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ overflow: false, left: false, right: false });
  const update = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const max = viewport.scrollWidth - viewport.clientWidth;
    const next = {
      overflow: max > 1,
      left: viewport.scrollLeft > 1,
      right: viewport.scrollLeft < max - 1,
    };
    setEdges((prev) =>
      prev.overflow === next.overflow && prev.left === next.left && prev.right === next.right
        ? prev
        : next
    );
  }, []);
  useEffect(() => {
    update();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    }
    const observer = new ResizeObserver(update);
    if (viewportRef.current) observer.observe(viewportRef.current);
    if (itemsRef.current) observer.observe(itemsRef.current);
    return () => observer.disconnect();
  }, [letterCount, update]);
  const slide = (direction: number) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.scrollBy({
      left: direction * Math.max(80, viewport.clientWidth * 0.75),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  };
  return (
    <div className="english-alphabet-tray tango-tray shrink-0">
      {edges.overflow && (
        <button
          type="button"
          className="tango-tray-arrow"
          aria-label="이전 블록 보기"
          disabled={!edges.left}
          onClick={() => slide(-1)}
        >
          <StorybookSprite name="next" className="tango-tray-arrow-left" />
        </button>
      )}
      <div className="tango-tray-frame">
        <div
          ref={viewportRef}
          onScroll={update}
          role="group"
          aria-label="알파벳 블록 고르기"
          tabIndex={0}
          className="tango-tray-viewport [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div ref={itemsRef} className="tango-tray-items">
            {children}
          </div>
        </div>
      </div>
      {edges.overflow && (
        <button
          type="button"
          className="tango-tray-arrow"
          aria-label="다음 블록 보기"
          disabled={!edges.right}
          onClick={() => slide(1)}
        >
          <StorybookSprite name="next" />
        </button>
      )}
    </div>
  );
}
