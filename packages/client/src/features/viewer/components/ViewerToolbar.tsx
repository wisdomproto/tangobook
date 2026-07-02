import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface ViewerToolbarProps {
  title: string;
  onBack: () => void;
  onHome: () => void;

  // Play controls — TTS 재생 + 자동 페이지 넘김 통합 단일 토글
  isPlaying: boolean; // autoPlayTts master switch
  onTogglePlayback: () => void;
  isBgmPlaying: boolean;
  onToggleBgm: () => void;
  hasBgm: boolean;

  // Settings
  darkMode: boolean;
  onToggleDark: () => void;
  textSize: 'sm' | 'md' | 'lg';
  onCycleTextSize: () => void;
  /** 음량 3단계 (전역) — 탭마다 소→중→대 순환 */
  volume: 'low' | 'mid' | 'high';
  onCycleVolume: () => void;
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
        'w-10 h-10 rounded-md flex items-center justify-center text-lg transition-all',
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
    <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-2 z-20 pointer-events-none flex-wrap">
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
        {/* 자동재생 — 단일 토글 (TTS + 자동 페이지 넘김) */}
        <PillIconBtn
          onClick={props.onTogglePlayback}
          active={props.isPlaying}
          label={props.isPlaying ? '자동재생 멈춤' : '자동재생'}
        >
          {props.isPlaying ? '⏸' : '▶'}
        </PillIconBtn>
        <PillIconBtn
          onClick={props.onToggleBgm}
          active={props.isBgmPlaying}
          disabled={!props.hasBgm}
          label="배경음악"
        >
          🎵
        </PillIconBtn>
        <PillIconBtn
          onClick={props.onCycleVolume}
          label={`음량: ${props.volume === 'low' ? '작게' : props.volume === 'mid' ? '보통' : '크게'}`}
        >
          {props.volume === 'low' ? '🔈' : props.volume === 'mid' ? '🔉' : '🔊'}
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
