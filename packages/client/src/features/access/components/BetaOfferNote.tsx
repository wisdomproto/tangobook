import { useTranslation } from 'react-i18next';
import { BETA_SIGNUP_DEADLINE } from '@tangobook/shared';

const DEADLINE_MS = Date.parse(BETA_SIGNUP_DEADLINE);

/**
 * 로그인·가입 화면의 베타 오퍼 한 줄 — "베타 기간에 가입하면 1년 무료".
 *
 * 🔴 날짜는 말하지 않는다 — 마감일을 약속하면 접을 때 그 약속이 발목을 잡는다.
 * 지금이 베타라는 사실만 알리고, 마감(BETA_SIGNUP_DEADLINE) 이 지나면 스스로 사라진다.
 * 오퍼를 접을 땐 상수만 되돌리면 된다(→ entitlement.ts).
 */
export function BetaOfferNote({ className }: { className?: string }) {
  const { t } = useTranslation('access');
  if (Date.now() >= DEADLINE_MS) return null;

  return (
    <p
      className={`mt-2 rounded-xl bg-coral-50 px-3 py-2 text-sm font-black text-coral-600 break-keep ${className ?? ''}`}
    >
      🎁 {t('betaOffer')}
    </p>
  );
}
