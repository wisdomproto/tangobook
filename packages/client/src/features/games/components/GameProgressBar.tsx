import { cn } from '@/lib/cn';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('games');
  if (total <= 0) return null;
  const compact = total > 11;

  return (
    <div className="game-progress flex shrink-0 flex-wrap items-center justify-center gap-3 bg-white px-4 py-2 rounded-full border border-ink-100">
      <span className="sr-only">
        {t('progress.question', { current: Math.min(current + 1, total), total })}
      </span>
      {compact ? (
        <span aria-hidden="true" className="font-bold text-ink-900 text-lg">
          {current + 1} / {total}
        </span>
      ) : (
        <div aria-hidden="true" className="flex gap-1.5 sm:gap-2">
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className={cn(
                'h-2.5 sm:h-3 rounded-md transition-all',
                i === current
                  ? 'w-8 sm:w-10 bg-coral-700'
                  : i < current
                    ? 'w-3 sm:w-4 bg-mint-600'
                    : 'w-3 sm:w-4 bg-ink-100'
              )}
            />
          ))}
        </div>
      )}
      <span
        className="font-semibold text-mint-700 text-base flex items-center gap-1.5"
        aria-label={t('progress.completed', { score })}
      >
        <span aria-hidden="true">✓</span>
        <span aria-hidden="true">{score}</span>
      </span>
    </div>
  );
}
