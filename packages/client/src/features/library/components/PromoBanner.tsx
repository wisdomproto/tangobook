import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { computeAccess } from '@tangobook/shared';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useEntitlement } from '@/features/payment/hooks/useEntitlement';
import { PAYWALL_ENABLED } from '@/features/access/config';
import { useGuestMode } from '@/features/access/hooks/useGuestMode';

const SHARE_URL = 'https://www.tangobook.co.kr';

/**
 * Slim promo bar at the top of the library — promo copy + one CTA, nothing else.
 *
 * 🔴 Only shown to someone with something left to convert:
 *   - guest   → "1 year free" signup hook, or "게스트 N일 남음" during the guest window
 *   - expired → subscribe hook + share button
 *   - signed up (trial / beta year / subscribed) → renders nothing. They already hold
 *     the benefit, so a "무료 체험 423일 남음" countdown is just noise.
 *
 * 🔴 Chrome (홈에 설치 · 프로필 칩 · 로그인/로그아웃) is NOT here — it lives in the
 * AppShell header alone, so the same button never appears twice on one screen.
 */
export function PromoBanner() {
  const { t } = useTranslation('access');
  const navigate = useNavigate();
  const { account } = useAuth();
  const { paidUntil, referralBonusDays, trialStartedAt } = useEntitlement();
  const guestMode = useGuestMode();

  // Compute access state directly from account + real subscription data,
  // NOT via useAccess() which returns 'subscribed' for everyone when PAYWALL_ENABLED=false.
  const raw = computeAccess({
    account: account ? { createdAt: account.createdAt } : null,
    subscription: paidUntil ? { status: 'active', currentPeriodEnd: paidUntil } : null,
    referralBonusDays,
    trialStartedAt,
  });

  const isGuest = raw.status === 'guest';
  const isExpired = raw.status === 'expired';

  // 🔴 프로모는 **아직 전환할 게 남은 사람에게만** 보여준다(2026-07-25).
  // 이미 가입한 사용자는 베타 1년 무료를 갖고 있어 "무료 체험 423일 남음" 같은 카운트다운이
  // 할 일 없는 소음이 된다 → 게스트(가입 유도)와 만료(구독 유도)만 노출.
  const showPromo = isGuest || (isExpired && PAYWALL_ENABLED);

  // 🔴 훅은 early return 앞에서 전부 호출한다(Rules of Hooks).
  const [shared, setShared] = useState(false);

  if (!showPromo) return null;

  let headline: ReactNode;
  if (isGuest && guestMode.active) {
    // 게스트 모드 30일 창 — 남은 일수를 보여줘 가입 전환을 재촉(CTA 는 그대로 가입).
    headline = t('entryGate.guestDays', { days: guestMode.daysLeft });
  } else if (isGuest) {
    headline = t('promo.guestHeadline');
  } else if (isExpired) {
    headline = t('promo.expiredHeadline');
  }

  // 공유 — 베타 1년 무료라 레퍼럴 코드가 불필요해졌다. 순수 앱 공유(코드 없음):
  // Web Share API 우선, 미지원(데스크탑 등)이면 링크 복사 폴백.
  const handleShare = async () => {
    const text = t('promo.shareText');
    try {
      if (navigator.share) {
        await navigator.share({ title: '탱고북', text, url: SHARE_URL });
        return;
      }
    } catch {
      return; // 사용자가 공유 시트를 닫음 — 폴백 복사하지 않음
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${SHARE_URL}`);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
      /* 클립보드 불가 환경 — 조용히 무시 */
    }
  };

  return (
    <div
      className="w-full rounded-2xl shadow-soft mb-6 px-4 py-2.5 md:py-3 flex flex-wrap items-center gap-x-4 gap-y-2 bg-gradient-to-r from-cream-50 to-peach-100"
      role="region"
      aria-label={t('promo.region')}
    >
      {/* 프로모 문구 + CTA — 이게 배너의 전부다(설치·프로필 칩은 헤더). */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <p className="text-sm md:text-base font-black font-display text-ink-900 break-keep leading-tight">
          {headline}
        </p>
        {isGuest ? (
          <button
            onClick={() => navigate('/login?mode=signup')}
            className="shrink-0 bg-coral-500 text-white font-black rounded-lg px-3 py-1.5 text-xs hover:brightness-110 transition"
          >
            {t('promo.startFree')}
          </button>
        ) : (
          <button
            onClick={handleShare}
            className="shrink-0 bg-coral-500 text-white font-black rounded-lg px-3 py-1.5 text-xs hover:brightness-110 transition"
          >
            {shared ? t('promo.shareCopied') : t('promo.share')}
          </button>
        )}
      </div>
    </div>
  );
}
