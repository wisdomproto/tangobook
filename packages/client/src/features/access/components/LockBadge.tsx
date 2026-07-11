import { useTranslation } from 'react-i18next';

/** 유료(프리미엄) 책 카드 위에 얹는 잠금 뱃지. 무료 책엔 표시 X. */
export function LockBadge({ className = '' }: { className?: string }) {
  const { t } = useTranslation('access');
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-ink-900/70 px-2.5 py-0.5 text-[11px] font-black text-white backdrop-blur-sm ${className}`}
      aria-label={t('lock.lockedContent')}
    >
      {t('lock.badge')}
    </span>
  );
}
