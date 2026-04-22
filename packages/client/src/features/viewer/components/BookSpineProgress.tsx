import { cn } from '@/lib/cn';

interface BookSpineProgressProps {
  current: number; // 0-based index
  total: number;
  compact?: boolean; // 페이지 많을 때 축약
}

export function BookSpineProgress({ current, total, compact }: BookSpineProgressProps) {
  if (total <= 0) return null;

  // compact 모드: 11페이지 이상일 때 자동 활성화 또는 prop으로 강제
  const useCompact = compact ?? total > 11;

  if (useCompact) {
    return (
      <div className="flex items-center gap-3 font-bold text-ink-700 text-sm">
        <div className="flex gap-1">
          <span className="w-6 h-2 rounded-md bg-coral-500" />
        </div>
        <span>
          {current + 1} / {total}
        </span>
      </div>
    );
  }

  return (
    <div className="flex gap-1" aria-label={`진행률 ${current + 1}/${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={cn(
            'h-1.5 rounded-md transition-all',
            i === current ? 'w-6 bg-coral-500' : i < current ? 'w-3 bg-ink-300' : 'w-3 bg-ink-100'
          )}
        />
      ))}
    </div>
  );
}
