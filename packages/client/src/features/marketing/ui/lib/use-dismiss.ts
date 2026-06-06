import * as React from 'react';

/**
 * Calls `onDismiss` when:
 *  - a click occurs outside `refs` elements
 *  - the Escape key is pressed
 *
 * Pass `enabled=false` to pause (e.g. when the overlay is closed).
 */
export function useDismiss(
  refs: React.RefObject<Element | null>[],
  onDismiss: () => void,
  enabled: boolean
) {
  React.useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onDismiss();
      }
    }

    function handlePointerDown(e: PointerEvent) {
      const target = e.target as Node;
      const inside = refs.some((r) => r.current?.contains(target));
      if (!inside) {
        onDismiss();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    // Use pointerdown so we catch the start of a click, matching typical outside-click UX
    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [enabled, onDismiss, refs]);
}
