import { useCallback, useRef } from 'react';
import type React from 'react';

interface BaseBlock {
  id: string;
  char: string;
}

interface UseBlockDragOptions {
  /** 터치 고스트 생성 함수 (block.char 등으로 DOM 요소 생성) */
  createGhost: (char: string) => HTMLDivElement;
  /** 고스트 중심 오프셋 (x, y) */
  ghostOffset: [number, number];
}

/**
 * 블록 게임 공통 드래그/터치 핸들링 훅.
 * Korean/English 블록 플레이어에서 공통으로 사용.
 */
export function useBlockDrag<B extends BaseBlock>({
  createGhost,
  ghostOffset,
}: UseBlockDragOptions) {
  const dragBlockRef = useRef<B | null>(null);
  const touchGhostRef = useRef<HTMLDivElement | null>(null);
  const gridCellRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const [offsetX, offsetY] = ghostOffset;

  const handleDragStart = useCallback((block: B, e: React.DragEvent) => {
    dragBlockRef.current = block;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', block.id);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(
    (key: string, e: React.DragEvent, onPlace: (key: string, block: B) => void) => {
      e.preventDefault();
      if (!dragBlockRef.current) return;
      onPlace(key, dragBlockRef.current);
      dragBlockRef.current = null;
    },
    []
  );

  const handleTouchStart = useCallback(
    (block: B, e: React.TouchEvent) => {
      dragBlockRef.current = block;
      const ghost = createGhost(block.char);
      ghost.style.position = 'fixed';
      ghost.style.pointerEvents = 'none';
      ghost.style.zIndex = '9999';
      ghost.style.left = `${e.touches[0].clientX - offsetX}px`;
      ghost.style.top = `${e.touches[0].clientY - offsetY}px`;
      document.body.appendChild(ghost);
      touchGhostRef.current = ghost;
    },
    [createGhost, offsetX, offsetY]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!touchGhostRef.current) return;
      touchGhostRef.current.style.left = `${e.touches[0].clientX - offsetX}px`;
      touchGhostRef.current.style.top = `${e.touches[0].clientY - offsetY}px`;
    },
    [offsetX, offsetY]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent, onPlace: (key: string, block: B) => void) => {
      touchGhostRef.current?.remove();
      touchGhostRef.current = null;
      const block = dragBlockRef.current;
      if (!block) return;
      const { clientX: x, clientY: y } = e.changedTouches[0];
      for (const [key, el] of gridCellRefs.current) {
        const r = el.getBoundingClientRect();
        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
          onPlace(key, block);
          break;
        }
      }
      dragBlockRef.current = null;
    },
    []
  );

  /** gridCellRefs에 등록하는 ref 콜백 생성 */
  const cellRef = useCallback(
    (key: string) => (el: HTMLDivElement | null) => {
      if (el) gridCellRefs.current.set(key, el);
      else gridCellRefs.current.delete(key);
    },
    []
  );

  return {
    gridCellRefs,
    cellRef,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
