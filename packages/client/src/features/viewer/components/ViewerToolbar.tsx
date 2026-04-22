import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface ViewerToolbarProps {
  title: string;
  onBack: () => void;
  onHome: () => void;

  // Play controls (위치 상단으로 이동)
  isTtsPlaying: boolean;
  onToggleTts: () => void;
  isBgmPlaying: boolean;
  onToggleBgm: () => void;
  hasBgm: boolean;
  autoPlayTts: boolean;
  onToggleAutoPlay: () => void;

  // Settings
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
  disabled?: boolean;
  label: string;
}

function PillIconBtn({ children, onClick, active, disabled, label }: PillIconBtnProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        'w-11 h-11 rounded-md flex items-center justify-center text-lg transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-400',
        disabled && 'opacity-40 cursor-not-allowed',
        active
          ? 'bg-coral-500 text-white shadow-pop'
          : 'bg-peach-100 hover:bg-peach-200 text-ink-700'
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="inline-block w-px h-6 bg-ink-100 mx-1" />;
}

export function ViewerToolbar(props: ViewerToolbarProps) {
  return (
    <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-20 pointer-events-none flex-wrap">
      {/* 좌: 뒤로가기 + 홈 + 제목 */}
      <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-md px-2 py-2 shadow-soft pointer-events-auto">
        <button
          onClick={props.onBack}
          aria-label="뒤로 가기"
          title="뒤로 가기"
          className="w-10 h-10 rounded-md bg-peach-100 hover:bg-peach-200 text-ink-700 flex items-center justify-center text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-400"
        >
          ←
        </button>
        <button
          onClick={props.onHome}
          aria-label="홈으로"
          title="홈으로"
          className="w-10 h-10 rounded-md bg-peach-100 hover:bg-peach-200 flex items-center justify-center text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-400"
        >
          🏠
        </button>
        <span className="font-black text-ink-900 text-sm hidden md:inline ml-1 mr-2 max-w-[18ch] truncate">
          {props.title}
        </span>
      </div>

      {/* 우: 재생 컨트롤 + 설정 */}
      <div className="flex gap-2 bg-white/90 backdrop-blur-sm rounded-md p-2 shadow-soft pointer-events-auto">
        {/* 재생 그룹 */}
        <PillIconBtn onClick={props.onToggleTts} active={props.isTtsPlaying} label="음성 듣기">
          🔊
        </PillIconBtn>
        <PillIconBtn
          onClick={props.onToggleBgm}
          active={props.isBgmPlaying}
          disabled={!props.hasBgm}
          label="배경음악"
        >
          🎵
        </PillIconBtn>
        <PillIconBtn onClick={props.onToggleAutoPlay} active={props.autoPlayTts} label="자동 넘김">
          ⏯
        </PillIconBtn>

        <Divider />

        {/* 설정 그룹 */}
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
