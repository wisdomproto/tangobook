import { useTranslation } from 'react-i18next';
import { TRIAL_DAYS } from '@tangobook/shared';

/**
 * 로그인·가입 화면의 오퍼 한 줄 — "가입하면 30일 무료".
 *
 * 🔴 일수는 `TRIAL_DAYS` 에서 가져온다(2026-08-11) — 예전엔 「베타 기간 1년 무료」를 문구에
 *    박아 두고 판정은 별도 상수(BETA_FREE_DAYS)가 했다. 둘이 갈리면 화면이 거짓말을 한다.
 *    이제 무료 기간을 바꾸려면 `TRIAL_DAYS` 한 곳만 고치면 문구까지 따라온다.
 * 🔴 날짜(마감일)는 여전히 말하지 않는다 — 약속하면 접을 때 그 약속이 발목을 잡는다.
 */
export function BetaOfferNote({ className }: { className?: string }) {
  const { t } = useTranslation('access');

  return (
    <p
      className={`mt-2 rounded-xl bg-coral-50 px-3 py-2 text-sm font-black text-coral-600 break-keep ${className ?? ''}`}
    >
      🎁 {t('betaOffer', { days: TRIAL_DAYS })}
    </p>
  );
}
