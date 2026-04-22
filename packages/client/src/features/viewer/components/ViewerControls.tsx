import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface ViewerControlsProps {
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
  isTtsPlaying: boolean;
  onToggleTts: () => void;
  isBgmPlaying: boolean;
  onToggleBgm: () => void;
  autoPlayTts: boolean;
  onToggleAutoPlay: () => void;
  hasBgm: boolean; // backgroundMusicUrl 없으면 BGM 버튼 비활성화
}

interface NavBtnProps {
  onClick: () => void;
  disabled: boolean;
  primary?: boolean;
  label: string;
  children: ReactNode;
}

function NavBtn({ onClick, disabled, primary, label, children }: NavBtnProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        'w-16 h-16 rounded-full flex items-center justify-center text-3xl transition-all',
        disabled && 'opacity-40 cursor-not-allowed',
        primary
          ? 'bg-coral-500 text-white shadow-pop hover:scale-105 active:scale-95'
          : 'bg-white/90 backdrop-blur-sm text-ink-900 shadow-soft hover:bg-white'
      )}
    >
      {children}
    </button>
  );
}

interface PlayBtnProps {
  active: boolean;
  onClick: () => void;
  label: string;
  children: ReactNode;
}

function PlayBtn({ active, onClick, label, children }: PlayBtnProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        'w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all',
        active
          ? 'bg-coral-500 text-white shadow-pop'
          : 'bg-peach-100 text-ink-700 hover:bg-peach-200'
      )}
    >
      {children}
    </button>
  );
}

export function ViewerControls(props: ViewerControlsProps) {
  return (
    <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center z-10 pointer-events-none">
      <div className="pointer-events-auto">
        <NavBtn onClick={props.onPrev} disabled={!props.canPrev} label="이전 페이지">
          ←
        </NavBtn>
      </div>
      <div className="flex gap-2.5 items-center bg-white/90 backdrop-blur-sm px-3 py-2 rounded-full shadow-soft pointer-events-auto">
        <PlayBtn active={props.isTtsPlaying} onClick={props.onToggleTts} label="음성 듣기">
          🔊
        </PlayBtn>
        <button
          onClick={props.onToggleBgm}
          disabled={!props.hasBgm}
          aria-label="배경음악"
          className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all',
            !props.hasBgm && 'opacity-40 cursor-not-allowed',
            props.isBgmPlaying
              ? 'bg-coral-500 text-white shadow-pop'
              : 'bg-peach-100 text-ink-700 hover:bg-peach-200'
          )}
        >
          🎵
        </button>
        <PlayBtn active={props.autoPlayTts} onClick={props.onToggleAutoPlay} label="자동 넘김">
          ⏯
        </PlayBtn>
      </div>
      <div className="pointer-events-auto">
        <NavBtn onClick={props.onNext} disabled={!props.canNext} primary label="다음 페이지">
          →
        </NavBtn>
      </div>
    </div>
  );
}
