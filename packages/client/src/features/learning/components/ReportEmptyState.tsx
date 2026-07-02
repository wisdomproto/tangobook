import { Link } from 'react-router-dom';
import { Mascot } from '@/design-system';

interface Props {
  emoji?: string;
  message: string;
  className?: string;
  /** true 면 이모지 대신 호리(waving) — 리포트 메인 빈 상태용 */
  mascot?: boolean;
  /** CTA 버튼 (예: "동화책 보러 가기" → /library) — 빈 상태를 dead-end 로 두지 않기 */
  ctaLabel?: string;
  ctaTo?: string;
}

export function ReportEmptyState({
  emoji = '📚',
  message,
  className = '',
  mascot = false,
  ctaLabel,
  ctaTo,
}: Props) {
  return (
    <div className={`flex flex-col items-center justify-center py-10 text-ink-500 ${className}`}>
      {mascot ? (
        <div className="mb-3">
          <Mascot state="waving" size="lg" character="hori" />
        </div>
      ) : (
        <div className="mb-3 text-5xl" aria-hidden>
          {emoji}
        </div>
      )}
      <p className="text-sm font-bold break-keep">{message}</p>
      {ctaLabel && ctaTo && (
        <Link
          to={ctaTo}
          className="mt-4 rounded-xl bg-coral-500 px-6 py-3 font-black text-white shadow-soft hover:brightness-110"
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}
