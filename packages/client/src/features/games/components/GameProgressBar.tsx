const COLOR_MAP: Record<string, { label: string; bar: string }> = {
  violet: { label: 'text-violet-600 dark:text-violet-400', bar: 'bg-violet-500' },
  sky: { label: 'text-sky-600 dark:text-sky-400', bar: 'bg-sky-500' },
  emerald: { label: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500' },
};

interface GameProgressBarProps {
  current: number;
  total: number;
  score?: number;
  accentColor?: 'violet' | 'sky' | 'emerald';
}

export function GameProgressBar({
  current,
  total,
  score,
  accentColor = 'violet',
}: GameProgressBarProps) {
  const progress = total > 0 ? (current / total) * 100 : 0;
  const { label, bar } = COLOR_MAP[accentColor];

  return (
    <div className="flex items-center gap-3">
      <span className={`text-xs font-bold ${label}`}>
        Q{current + 1}/{total}
      </span>
      <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${bar} rounded-full transition-all duration-300`}
          style={{ width: `${progress}%` }}
        />
      </div>
      {score !== undefined && (
        <span className="text-xs text-slate-400 dark:text-slate-500">{score}점</span>
      )}
    </div>
  );
}
