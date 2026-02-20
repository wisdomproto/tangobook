interface BatchProgressBarProps {
  current: number;
  total: number;
  label: string;
  onCancel: () => void;
}

export function BatchProgressBar({ current, total, label, onCancel }: BatchProgressBarProps) {
  const percent = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="bg-violet-50 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-violet-800 dark:text-violet-200">
          {label} ({current}/{total})
        </span>
        <button onClick={onCancel} className="text-xs text-red-500 hover:text-red-600 font-medium">
          취소
        </button>
      </div>
      <div className="w-full bg-violet-200 dark:bg-violet-800 rounded-full h-2">
        <div
          className="bg-violet-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
