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
    <div className="flex items-center gap-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-soft">
      {compact ? (
        <span className="font-black text-ink-900 text-lg">
          {current + 1} / {total}
        </span>
      ) : (
        <div className="flex gap-1">
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className={cn(
                'h-1.5 rounded-md transition-all',
                i === current
                  ? 'w-6 bg-coral-500'
                  : i < current
                    ? 'w-3 bg-ink-300'
                    : 'w-3 bg-ink-100'
              )}
            />
          ))}
        </div>
      )}
      <span className="font-black text-success text-lg flex items-center gap-1">
        <span>✓</span>
        <span>{score}</span>
      </span>
    </div>
  );
}
