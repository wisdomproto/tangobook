interface ViewerControlsProps {
  currentPage: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  onGoToPage: (page: number) => void;
  // Audio
  hasTts: boolean;
  isTtsPlaying: boolean;
  onToggleTts: () => void;
  hasBgm: boolean;
  isBgmPlaying: boolean;
  onToggleBgm: () => void;
  autoPlayTts: boolean;
  onToggleAutoPlay: () => void;
  darkMode: boolean;
}

export function ViewerControls({
  currentPage,
  totalPages,
  onPrev,
  onNext,
  onGoToPage,
  hasTts,
  isTtsPlaying,
  onToggleTts,
  hasBgm,
  isBgmPlaying,
  onToggleBgm,
  autoPlayTts,
  onToggleAutoPlay,
  darkMode,
}: ViewerControlsProps) {
  const isFirst = currentPage === 0;
  const isLast = currentPage === totalPages - 1;
  const progress = totalPages > 1 ? (currentPage / (totalPages - 1)) * 100 : 0;

  const btnClass = `p-3 rounded-xl transition-colors ${
    darkMode
      ? 'hover:bg-white/10 text-white/80 hover:text-white'
      : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'
  }`;

  const smallBtnClass = `p-2 rounded-lg transition-colors ${
    darkMode
      ? 'hover:bg-white/10 text-white/60 hover:text-white'
      : 'hover:bg-gray-200 text-gray-500 hover:text-gray-800'
  }`;

  return (
    <div className="px-4 py-3 bg-black/30 backdrop-blur-sm">
      {/* Progress bar */}
      <div
        className="w-full h-1 bg-white/10 rounded-full mb-3 cursor-pointer"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const ratio = (e.clientX - rect.left) / rect.width;
          onGoToPage(Math.round(ratio * (totalPages - 1)));
        }}
      >
        <div
          className="h-full bg-violet-500 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        {/* Left: Audio controls */}
        <div className="flex items-center gap-1">
          {hasTts && (
            <button
              onClick={onToggleTts}
              className={smallBtnClass}
              title={isTtsPlaying ? 'TTS 정지' : 'TTS 재생'}
            >
              {isTtsPlaying ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 9v6m4-6v6"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
            </button>
          )}
          {hasTts && (
            <button
              onClick={onToggleAutoPlay}
              className={`${smallBtnClass} text-[10px] font-medium ${autoPlayTts ? '!text-violet-400' : ''}`}
              title={autoPlayTts ? '자동재생 끄기' : '자동재생 켜기'}
            >
              AUTO
            </button>
          )}
          {hasBgm && (
            <button
              onClick={onToggleBgm}
              className={`${smallBtnClass} ${isBgmPlaying ? '!text-violet-400' : ''}`}
              title={isBgmPlaying ? '배경음악 끄기' : '배경음악 켜기'}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Center: Navigation */}
        <div className="flex items-center gap-3">
          <button
            onClick={onPrev}
            disabled={isFirst}
            className={`${btnClass} ${isFirst ? 'opacity-30 cursor-not-allowed' : ''}`}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <span
            className={`text-sm tabular-nums min-w-[60px] text-center ${darkMode ? 'text-white/70' : 'text-gray-500'}`}
          >
            {currentPage + 1} / {totalPages}
          </span>

          <button
            onClick={onNext}
            disabled={isLast}
            className={`${btnClass} ${isLast ? 'opacity-30 cursor-not-allowed' : ''}`}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Right: spacer for symmetry */}
        <div className="w-[120px]" />
      </div>
    </div>
  );
}
