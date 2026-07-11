import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
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
        'w-9 h-9 sm:w-10 sm:h-10 rounded-md flex items-center justify-center text-base sm:text-lg transition-all',
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
  const { t } = useTranslation('viewer');
  const volumeLevelLabel =
    props.volume === 'low'
      ? t('toolbar.volumeLow')
      : props.volume === 'mid'
        ? t('toolbar.volumeMid')
        : t('toolbar.volumeHigh');
  return (
    <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-2 z-20 pointer-events-none flex-wrap">
      {/* 좌: 뒤로가기 + 홈 + 제목 */}
      <div className="flex items-center gap-1 sm:gap-2 bg-white/90 backdrop-blur-sm rounded-md px-1.5 py-1.5 sm:px-2 sm:py-2 shadow-soft pointer-events-auto">
        <button
          onClick={props.onBack}
          aria-label={t('toolbar.back')}
          title={t('toolbar.back')}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-md bg-peach-100 hover:bg-peach-200 text-ink-700 flex items-center justify-center text-base sm:text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-400"
        >
          ←
        </button>
        <button
          onClick={props.onHome}
          aria-label={t('toolbar.home')}
          title={t('toolbar.home')}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-md bg-peach-100 hover:bg-peach-200 flex items-center justify-center text-base sm:text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-400"
        >
          🏠
        </button>
        <span className="font-black text-ink-900 text-sm hidden md:inline ml-1 mr-2 max-w-[18ch] truncate">
          {props.title}
        </span>
      </div>

      {/* 우: 재생 컨트롤 + 설정 */}
      <div className="flex gap-1 sm:gap-2 bg-white/90 backdrop-blur-sm rounded-md p-1.5 sm:p-2 shadow-soft pointer-events-auto">
        {/* 자동재생 — 단일 토글 (TTS + 자동 페이지 넘김) */}
        <PillIconBtn
          onClick={props.onTogglePlayback}
          active={props.isPlaying}
          label={props.isPlaying ? t('toolbar.autoplayStop') : t('toolbar.autoplay')}
        >
          {props.isPlaying ? '⏸' : '▶'}
        </PillIconBtn>
        <PillIconBtn
          onClick={props.onToggleBgm}
          active={props.isBgmPlaying}
          disabled={!props.hasBgm}
          label={t('toolbar.bgm')}
        >
          🎵
        </PillIconBtn>
        <PillIconBtn
          onClick={props.onCycleVolume}
          label={t('toolbar.volume', { level: volumeLevelLabel })}
        >
          {props.volume === 'low' ? '🔈' : props.volume === 'mid' ? '🔉' : '🔊'}
        </PillIconBtn>

        <Divider />

        {/* 설정 그룹 */}
        <PillIconBtn
          onClick={props.onToggleDark}
          active={props.darkMode}
          label={t('toolbar.darkMode')}
        >
          🌗
        </PillIconBtn>
        <PillIconBtn onClick={props.onCycleTextSize} label={t('toolbar.textSize')}>
          Aa
        </PillIconBtn>
        {/* 언어 바꾸기 버튼 제거 — 언어는 책 진입 전(BookDetailPage)에서 선택하므로 뷰어엔 불필요. */}
        <PillIconBtn
          onClick={props.onToggleFullscreen}
          active={props.fullscreenImage}
          label={t('toolbar.fullscreenImage')}
        >
          ⛶
        </PillIconBtn>
      </div>
    </div>
  );
}
