import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

/** Each branch can be folded independently; navigation reopens the current route's ancestry. */
export function WorkspaceTreeBranch({
  title,
  children,
  defaultOpen,
  followKey,
  kind,
  current = false,
  onOpen,
}: {
  title: ReactNode;
  children: ReactNode;
  defaultOpen: boolean;
  followKey: string;
  kind: 'book' | 'chapter' | 'section';
  current?: boolean;
  onOpen?: () => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const branch = useRef<HTMLLIElement>(null);
  const reveal = useRef(false);
  useEffect(() => setOpen(defaultOpen), [defaultOpen, followKey]);
  useEffect(() => {
    if (!open || !reveal.current) return;
    reveal.current = false;
    const frame = requestAnimationFrame(() => {
      const node = branch.current;
      const list = node?.closest<HTMLElement>('.journey-chapter-activities');
      if (!node || !list || list.clientHeight <= 0) return;
      const box = node.getBoundingClientRect();
      const viewport = list.getBoundingClientRect();
      // Scroll only this list. For a tall group keep its heading and first
      // activities visible, instead of jumping past them to the last game.
      const visibleHeight = Math.min(box.height, list.clientHeight - 16);
      const hiddenBelow = box.top + visibleHeight - (viewport.bottom - 8);
      const hiddenAbove = box.top - (viewport.top + 8);
      const delta = hiddenAbove < 0 ? hiddenAbove : Math.max(0, hiddenBelow);
      if (delta)
        list.scrollBy({
          top: delta,
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
            ? 'instant'
            : 'smooth',
        });
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);
  return (
    <li
      ref={branch}
      className="workspace-tree-branch"
      data-kind={kind}
      data-current-chapter={current || undefined}
    >
      <button
        type="button"
        className="workspace-tree-toggle"
        aria-expanded={open}
        onClick={() => {
          if (!open) {
            reveal.current = true;
            onOpen?.();
          }
          setOpen((value) => !value);
        }}
      >
        <ChevronDown size={17} aria-hidden="true" data-open={open} />
        {title}
      </button>
      {open && <ol className="workspace-tree-children">{children}</ol>}
    </li>
  );
}
