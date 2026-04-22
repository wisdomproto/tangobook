import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface ViewerControlsProps {
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
}

interface NavBtnProps {
  onClick: () => void;
  disabled: boolean;
  primary?: boolean;
  label: string;
  position: 'left' | 'right';
  children: ReactNode;
}

function NavBtn({ onClick, disabled, primary, label, position, children }: NavBtnProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        'absolute top-1/2 -translate-y-1/2 z-10 w-16 h-16 rounded-full flex items-center justify-center text-3xl transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-400',
        position === 'left' ? 'left-4 sm:left-6' : 'right-4 sm:right-6',
        disabled && 'opacity-30 cursor-not-allowed pointer-events-none',
        primary
          ? 'bg-coral-500 text-white shadow-pop hover:scale-105 active:scale-95'
          : 'bg-white/90 backdrop-blur-sm text-ink-900 shadow-soft hover:bg-white hover:scale-105'
      )}
    >
      {children}
    </button>
  );
}

export function ViewerControls(props: ViewerControlsProps) {
  return (
    <>
      <NavBtn onClick={props.onPrev} disabled={!props.canPrev} position="left" label="이전 페이지">
        ←
      </NavBtn>
      <NavBtn
        onClick={props.onNext}
        disabled={!props.canNext}
        primary
        position="right"
        label="다음 페이지"
      >
        →
      </NavBtn>
    </>
  );
}
