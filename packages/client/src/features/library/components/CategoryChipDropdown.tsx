import { useEffect, useRef, useState } from 'react';

interface Props {
  current: string;
  categories: string[];
  emojiOf: (cat: string) => string;
  onPick: (next: string) => void;
  disabled?: boolean;
}

export function CategoryChipDropdown({ current, categories, emojiOf, onPick, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) setOpen((v) => !v);
        }}
        disabled={disabled}
        className="px-1.5 py-0.5 rounded-full bg-white/90 text-ink-900 text-[10px] font-black shadow-soft hover:bg-white flex items-center gap-1 max-w-[120px]"
        title="카테고리 변경"
      >
        <span>{emojiOf(current)}</span>
        <span className="truncate">{current}</span>
        <span className="text-ink-400">▾</span>
      </button>
      {open && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute top-full left-0 mt-1 z-20 bg-white rounded-2xl shadow-pop border border-ink-100 py-1 min-w-[180px] max-h-[260px] overflow-y-auto"
        >
          {categories.map((c) => {
            const isCurrent = c === current;
            return (
              <button
                key={c}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  if (!isCurrent) onPick(c);
                }}
                className={`w-full px-3 py-2 text-left text-sm font-bold flex items-center gap-2 hover:bg-cream-50 ${
                  isCurrent ? 'text-coral-700 bg-coral-50' : 'text-ink-800'
                }`}
              >
                <span>{emojiOf(c)}</span>
                <span className="flex-1 truncate">{c}</span>
                {isCurrent && <span>✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
