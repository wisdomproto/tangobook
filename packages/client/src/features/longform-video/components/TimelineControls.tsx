interface TimelineControlsProps {
  isPlaying: boolean;
  currentTime: number;
  totalDuration: number;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  onOpenSubtitleStyle: () => void;
  onSplit?: () => void;
  canSplit?: boolean;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function TimelineControls({
  isPlaying,
  currentTime,
  totalDuration,
  onPlay,
  onPause,
  onSeek,
  onOpenSubtitleStyle,
  onSplit,
  canSplit,
}: TimelineControlsProps) {
  const handleToggle = () => {
    if (isPlaying) {
      onPause();
    } else {
      onPlay();
    }
  };

  const handleRestart = () => {
    onSeek(0);
  };

  return (
    <div className="flex items-center gap-3 px-2 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
      {/* Restart */}
      <button
        onClick={handleRestart}
        className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors"
        title="처음으로"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
          />
        </svg>
      </button>

      {/* Play / Pause */}
      <button
        onClick={handleToggle}
        disabled={totalDuration === 0}
        className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors disabled:opacity-50"
        title={isPlaying ? '일시정지' : '재생'}
      >
        {isPlaying ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      {/* Time display */}
      <span className="text-xs font-mono text-slate-600 dark:text-slate-400 min-w-[80px] text-center">
        {formatTime(currentTime)} / {formatTime(totalDuration)}
      </span>

      {/* Seek bar */}
      <input
        type="range"
        min={0}
        max={totalDuration || 1}
        step={0.1}
        value={currentTime}
        onChange={(e) => onSeek(parseFloat(e.target.value))}
        className="flex-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full appearance-none cursor-pointer accent-violet-600"
      />

      {/* Split button */}
      {onSplit && (
        <button
          onClick={onSplit}
          disabled={!canSplit}
          className="flex items-center gap-1 px-2 py-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="현재 위치에서 장면 분할"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-7 7m7-7l-7-7"
            />
          </svg>
          <span className="text-xs">분할</span>
        </button>
      )}

      {/* Subtitle style button */}
      <button
        onClick={onOpenSubtitleStyle}
        className="flex items-center gap-1 px-2 py-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors"
        title="자막 스타일"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
          />
        </svg>
        <span className="text-xs">자막 스타일</span>
      </button>
    </div>
  );
}
