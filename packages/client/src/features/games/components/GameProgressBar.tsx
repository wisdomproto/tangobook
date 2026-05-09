import { cn } from '@/lib/cn';

interface GameProgressBarProps {
  current: number; // 0-based
  total: number;
  score: number; // 맞힌 개수
}

/**
 * 게임 진행 도트 + 정답 점수 표시.
 * - total ≤ 11: 도트 시각화 (현재 idx는 coral-500 확장)
 * - total > 11: compact 모드 (숫자만)
 *
 * mvp-simplification 정책: 학습자 화면 별 UI 전부 hide.
 * ⭐ 아이콘 → ✓ 정답 표시.
 */
export function GameProgressBar({ current, total, score }: GameProgressBarProps) {
  if (total <= 0) return null;
  const compact = total > 11;

  return (
    <div className="flex items-center gap-5 sm:gap-7 bg-white/95 backdrop-blur-sm px-6 sm:px-8 py-3 sm:py-4 rounded-full shadow-pop">
      {compact ? (
        <span className="font-black text-ink-900 text-2xl sm:text-3xl">
          {current + 1} / {total}
        </span>
      ) : (
        <div className="flex gap-1.5 sm:gap-2">
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className={cn(
                'h-2.5 sm:h-3 rounded-md transition-all',
                i === current
                  ? 'w-10 sm:w-12 bg-coral-500'
                  : i < current
                    ? 'w-5 sm:w-6 bg-ink-300'
                    : 'w-5 sm:w-6 bg-ink-100'
              )}
            />
          ))}
        </div>
      )}
      <span className="font-black text-success text-2xl sm:text-3xl flex items-center gap-1.5">
        <span>✓</span>
        <span>{score}</span>
      </span>
    </div>
  );
}
