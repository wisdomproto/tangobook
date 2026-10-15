import { useEffect, useState, type ReactNode } from 'react';
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
  useEffect(() => setOpen(defaultOpen), [defaultOpen, followKey]);
  return (
    <li
      className="workspace-tree-branch"
      data-kind={kind}
      data-current-chapter={current || undefined}
    >
      <button
        type="button"
        className="workspace-tree-toggle"
        aria-expanded={open}
        onClick={() => {
          if (!open) onOpen?.();
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
