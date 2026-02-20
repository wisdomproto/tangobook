import { useState, useRef, useEffect } from 'react';

interface UploadMenuProps {
  onFile: (file: File) => void;
  openFilePicker: () => void;
  disabled?: boolean;
  /** Button size variant */
  size?: 'sm' | 'md';
}

/**
 * Upload button with dropdown menu showing:
 * - 파일 선택 (file picker)
 * - 클립보드에서 붙여넣기 (clipboard paste)
 * - 드래그앤드롭 hint
 */
export function UploadMenu({ onFile, openFilePicker, disabled, size = 'sm' }: UploadMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handlePaste = async () => {
    setOpen(false);
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = item.types.find((t) => t.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const file = new File([blob], 'pasted-image.png', { type: imageType });
          onFile(file);
          return;
        }
      }
      alert('클립보드에 이미지가 없습니다.');
    } catch {
      alert('클립보드 접근이 실패했습니다. 브라우저 권한을 확인하세요.');
    }
  };

  const btnClass =
    size === 'md'
      ? 'inline-flex items-center justify-center px-3 py-2 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition'
      : 'inline-flex items-center justify-center px-2 py-1 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition';

  const iconSize = size === 'md' ? 16 : 14;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        disabled={disabled}
        className={btnClass}
        title="이미지 업로드"
      >
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg py-1 w-48">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openFilePicker();
              setOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
          >
            <svg
              className="w-4 h-4 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
            파일 선택
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePaste();
            }}
            className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
          >
            <svg
              className="w-4 h-4 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            클립보드에서 붙여넣기
          </button>
          <div className="border-t border-slate-100 dark:border-slate-700 mt-1 pt-1 px-3 py-1.5">
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              이미지를 직접 드래그해서 놓을 수도 있어요
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
