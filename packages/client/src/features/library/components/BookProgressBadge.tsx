import { cn } from '@/lib/cn';
import type { ReadingStatus } from '../hooks/useReadingStatus';

interface BookProgressBadgeProps {
  status: ReadingStatus | undefined;
  className?: string;
}

const STYLES: Record<
  Exclude<ReadingStatus, 'unread'>,
  { icon: string; bg: string; label: string }
> = {
  reading: { icon: '📖', bg: 'bg-warn text-ink-900', label: '읽는 중' },
  finished: { icon: '✅', bg: 'bg-success text-white', label: '완독' },
};

/**
 * 책 카드 우상단 progress 뱃지 — useReadingStatus 결과를 시각화.
 * - reading: 📖 amber (읽는 중)
 * - finished: ✅ green (완독)
 * - unread: null (안 보임)
 */
export function BookProgressBadge({ status, className }: BookProgressBadgeProps) {
  if (!status || status === 'unread') return null;
  const s = STYLES[status];
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black shadow-soft',
        s.bg,
        className
      )}
      title={s.label}
    >
      <span>{s.icon}</span>
      <span>{s.label}</span>
    </div>
  );
}
