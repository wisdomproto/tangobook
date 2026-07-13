import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';
import type { ReadingStatus } from '../hooks/useReadingStatus';

interface BookProgressBadgeProps {
  status: ReadingStatus | undefined;
  className?: string;
}

const STYLES: Record<
  Exclude<ReadingStatus, 'unread'>,
  { icon: string; bg: string; labelKey: string }
> = {
  reading: { icon: '📖', bg: 'bg-warn text-ink-900', labelKey: 'badge.reading' },
  finished: { icon: '✅', bg: 'bg-success text-white', labelKey: 'badge.finished' },
};

/**
 * 책 카드 우상단 progress 뱃지 — useReadingStatus 결과를 시각화.
 * - reading: 📖 amber (읽는 중)
 * - finished: ✅ green (완독)
 * - unread: null (안 보임)
 */
export function BookProgressBadge({ status, className }: BookProgressBadgeProps) {
  const { t } = useTranslation('library');
  if (!status || status === 'unread') return null;
  const s = STYLES[status];
  const label = t(s.labelKey);
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black shadow-soft',
        s.bg,
        className
      )}
      title={label}
    >
      <span>{s.icon}</span>
      <span>{label}</span>
    </div>
  );
}
