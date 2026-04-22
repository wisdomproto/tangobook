import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface ViewerToolbarProps {
  title: string;
  onHome: () => void;
  darkMode: boolean;
  onToggleDark: () => void;
  textSize: 'sm' | 'md' | 'lg';
  onCycleTextSize: () => void;
  language: string;
  onToggleLanguage?: () => void;
  fullscreenImage: boolean;
  onToggleFullscreen: () => void;
}

interface PillIconBtnProps {
  children: ReactNode;
  onClick: () => void;
  active?: boolean;
  label: string;
}

function PillIconBtn({ children, onClick, active, label }: PillIconBtnProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        'w-11 h-11 rounded-md flex items-center justify-center text-lg transition-all',
        active
          ? 'bg-coral-500 text-white shadow-pop'
          : 'bg-peach-100 hover:bg-peach-200 text-ink-700'
      )}
    >
      {children}
    </button>
  );
}

export function ViewerToolbar(props: ViewerToolbarProps) {
  return (
    <div className="absolute top-3 left-3 right-3 flex justify-between items-center z-10 pointer-events-none">
      {/* 좌: 홈 + 제목 */}
      <div className="flex items-center gap-2 bg-white/85 backdrop-blur-sm rounded-md pl-3 pr-4 py-2 shadow-soft pointer-events-auto">
        <button
          onClick={props.onHome}
          aria-label="홈으로"
          className="text-xl hover:scale-110 transition-transform"
        >
          🏠
        </button>
        <span className="font-black text-ink-900 text-sm hidden sm:inline">{props.title}</span>
      </div>

      {/* 우: 설정 */}
      <div className="flex gap-2 bg-white/85 backdrop-blur-sm rounded-md p-2 shadow-soft pointer-events-auto">
        <PillIconBtn onClick={props.onToggleDark} active={props.darkMode} label="다크모드">
          🌗
        </PillIconBtn>
        <PillIconBtn onClick={props.onCycleTextSize} label="글자 크기">
          Aa
        </PillIconBtn>
        {props.onToggleLanguage && (
          <PillIconBtn onClick={props.onToggleLanguage} label="언어 바꾸기">
            🌐
          </PillIconBtn>
        )}
        <PillIconBtn
          onClick={props.onToggleFullscreen}
          active={props.fullscreenImage}
          label="이미지 크게 보기"
        >
          ⛶
        </PillIconBtn>
      </div>
    </div>
  );
}
