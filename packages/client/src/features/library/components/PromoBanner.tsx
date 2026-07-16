import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { computeAccess } from '@tangobook/shared';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useEntitlement } from '@/features/payment/hooks/useEntitlement';
import { InviteButton } from '@/features/payment';
import { PAYWALL_ENABLED } from '@/features/access/config';
import { InstallPwaButton, useCanInstallPwa } from '@/components/InstallPwaButton';

/**
 * Single-slide promo banner advertising 7-day free trial / referral bonus.
 *
 * Copy and CTA change based on user state computed DIRECTLY from account age +
 * real subscription data — intentionally decoupled from PAYWALL_ENABLED so
 * logged-in users see their trial countdown even before paywall goes live.
 * Gating (what content is locked) still respects PAYWALL_ENABLED elsewhere.
 *
 *   - guest  → login prompt
 *   - trial  → days remaining + InviteButton (copy invite link)
 *   - expired → referral CTA + InviteButton
 *   - subscribed (real paid subscription) → hidden (returns null)
 *
 * Asset: public/images/library-banner/promo.webp
 *   1872×1248, tiger mascot + gift on RIGHT half; left ~40% is open cream space.
 */
export function PromoBanner() {
  const { t } = useTranslation('access');
  const navigate = useNavigate();
  const { account } = useAuth();
  const { paidUntil, referralBonusDays, trialStartedAt } = useEntitlement();
  // 홈에 설치 가능 여부 (로그인 무관). 가능하면 배너 우측 일러스트 대신 큰 설치 버튼 노출.
  const { show: canInstallPwa } = useCanInstallPwa();

  // Compute access state directly from account + real subscription data,
  // NOT via useAccess() which returns 'subscribed' for everyone when PAYWALL_ENABLED=false.
  const raw = computeAccess({
    account: account ? { createdAt: account.createdAt } : null,
    subscription: paidUntil ? { status: 'active', currentPeriodEnd: paidUntil } : null,
    referralBonusDays,
    trialStartedAt,
  });

  // Real paid subscriber — hide banner entirely
  if (raw.status === 'subscribed') return null;

  const isGuest = raw.status === 'guest';
  const isTrial = raw.status === 'trial';

  let headline: ReactNode;
  let sub: string;

  // 양방향 초대 카피 — 세련되고 따뜻하게, 판매 냄새 X. (드롭박스식: 친구·나 둘 다 +7일)
  const referralSub = t('promo.referralSub');

  if (isGuest) {
    headline = t('promo.guestHeadline');
    sub = referralSub;
  } else if (isTrial) {
    // 남은 일수를 앞세워 "무료 며칠 남았는지" 한눈에(부모 요청). 상실 프레이밍은 피함.
    // 'N일' 강조 — 코랄색 + 크게(부모 요청).
    headline = (
      <Trans
        t={t}
        i18nKey="promo.trialHeadline"
        values={{ days: raw.trialDaysLeft }}
        components={{ big: <span className="text-coral-600 text-[1.3em] tabular-nums" /> }}
      />
    );
    sub = referralSub;
  } else if (!PAYWALL_ENABLED) {
    // 출시 전(유료화 OFF): 전체 무료 상태 — 오래된 계정이 "만료"로 보이던 버그 방지.
    headline = t('promo.preOpenHeadline');
    sub = referralSub;
  } else {
    // expired (유료화 ON): 구독을 1순위로, 초대는 보조.
    headline = t('promo.expiredHeadline');
    sub = t('promo.expiredSub');
  }

  return (
    <div
      className="relative w-full min-h-[118px] sm:min-h-[126px] md:min-h-[140px] lg:min-h-[156px] rounded-2xl overflow-hidden shadow-soft mb-8 md:mb-10 flex bg-gradient-to-br from-cream-50 to-peach-100"
      role="region"
      aria-label={t('promo.region')}
    >
      {/* Left zone — text overlay on the open cream area.
          모바일은 고정 aspect 대신 콘텐츠 높이(min-h)로 — 긴 한글 헤드라인 잘림 방지. */}
      <div className="relative w-3/5 sm:w-1/2 shrink-0 flex items-center py-4 sm:py-0 pl-5 pr-3 sm:pl-16 sm:pr-4 md:pl-20 md:pr-6 z-10">
        <div className="min-w-0">
          {/* 헤드라인은 1줄 고정 — 길면 오른쪽 일러스트 위로 얹혀서 노출 (요청). */}
          <h2 className="whitespace-nowrap text-base sm:text-lg md:text-xl lg:text-2xl font-black font-display text-ink-900 leading-tight [text-shadow:0_1px_2px_rgba(255,255,255,0.7)]">
            {headline}
          </h2>
          <p className="hidden sm:block text-xs md:text-sm lg:text-base font-bold text-ink-600 mt-1 md:mt-2 leading-snug break-keep">
            {sub}
          </p>
          {isGuest ? (
            <button
              onClick={() => navigate('/login?mode=signup')}
              className="mt-2 md:mt-3 bg-coral-500 text-white font-black rounded-xl px-5 py-2.5 text-xs md:text-sm hover:brightness-110 transition"
            >
              {t('promo.startFree')}
            </button>
          ) : (
            <InviteButton className="mt-2 md:mt-3 bg-coral-500 text-white font-black rounded-xl px-5 py-2.5 text-xs md:text-sm hover:brightness-110 transition" />
          )}
        </div>
      </div>

      {/* Right zone — 설치 가능(Chrome/Android/iOS Safari)하면 호랑이 일러스트 대신 큰 "홈에 설치"
          버튼(로그인 무관, 사용자 요청 2026-07-16). 설치 불가 환경(데스크탑·인앱 브라우저)은 일러스트 폴백. */}
      {canInstallPwa ? (
        <div className="relative z-10 flex flex-1 items-center justify-center overflow-hidden px-3 sm:px-4">
          <InstallPwaButton
            className="flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-coral-500 px-4 py-3 text-sm font-black text-white shadow-pop transition hover:brightness-110 sm:px-5 sm:py-3.5 sm:text-base md:px-6 md:py-4 md:text-lg"
            iconClassName="text-xl leading-none sm:text-2xl"
          />
        </div>
      ) : (
        <div
          className="relative flex-1 overflow-hidden"
          style={{
            backgroundImage: 'url(/images/library-banner/promo.webp)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            maskImage: 'linear-gradient(to right, transparent 0%, black 5%, black 100%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 5%, black 100%)',
          }}
          aria-hidden
        />
      )}
    </div>
  );
}
