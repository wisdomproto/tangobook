import { useTranslation } from 'react-i18next';
import { BETA_SIGNUP_DEADLINE } from '@tangobook/shared';

const DEADLINE_MS = Date.parse(BETA_SIGNUP_DEADLINE);

/**
 * 로그인·가입 화면의 베타 오퍼 한 줄 — "언제까지 가입하면 1년 무료".
 *
 * 🔴 마감(BETA_SIGNUP_DEADLINE) 이 지나면 스스로 사라진다. 오퍼를 접을 때 상수만
 * 되돌리면 되도록(→ entitlement.ts) 여기엔 날짜를 박지 않는다.
 */
export function BetaOfferNote({ className }: { className?: string }) {
  const { t, i18n } = useTranslation('access');
  if (Date.now() >= DEADLINE_MS) return null;

  // 마감은 2027-01-01 00:00 KST = 실제로는 "2026년 12월 31일까지" 가입 가능.
  const date = new Intl.DateTimeFormat(i18n.language, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Seoul',
  }).format(new Date(DEADLINE_MS - 1));

  return (
    <p
      className={`mt-2 rounded-xl bg-coral-50 px-3 py-2 text-sm font-black text-coral-600 break-keep ${className ?? ''}`}
    >
      🎁 {t('betaOffer', { date })}
    </p>
  );
}
