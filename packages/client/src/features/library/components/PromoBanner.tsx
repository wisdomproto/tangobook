import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { computeAccess } from '@tangobook/shared';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useEntitlement } from '@/features/payment/hooks/useEntitlement';
import { PAYWALL_ENABLED } from '@/features/access/config';
import { InstallPwaButton } from '@/components/InstallPwaButton';

const SHARE_URL = 'https://www.tangobook.co.kr';

/**
 * Slim promo bar for the library top — 7-day trial / referral copy on the left,
 * 홈에 설치 + 로그인/로그아웃 on the right. No mascot art, single low row.
 *
 * Copy changes from account age + real subscription data (decoupled from
 * PAYWALL_ENABLED so trial countdown shows before paywall goes live):
 *   - guest   → "1 year free" signup hook + start CTA
 *   - trial   → days remaining + share button (beta = 1yr free, referral moot)
 *   - expired → subscribe hook + share button
 *   - subscribed → promo text hidden, bar keeps the install/auth buttons
 *
 * 🔴 The install + logout buttons live here (not the AppShell header) on the
 * library root — AppShell hides its own copy when isLibraryRoot so they don't
 * double up. The bar therefore renders for EVERY library user (subscribers
 * included) so logout stays reachable; other pages keep the header buttons.
 */
export function PromoBanner() {
  const { t } = useTranslation('access');
  const { t: ts } = useTranslation('shell');
  const navigate = useNavigate();
  const { account, session, signOut, isConfigured } = useAuth();
  const { paidUntil, referralBonusDays, trialStartedAt } = useEntitlement();

  // Compute access state directly from account + real subscription data,
  // NOT via useAccess() which returns 'subscribed' for everyone when PAYWALL_ENABLED=false.
  const raw = computeAccess({
    account: account ? { createdAt: account.createdAt } : null,
    subscription: paidUntil ? { status: 'active', currentPeriodEnd: paidUntil } : null,
    referralBonusDays,
    trialStartedAt,
  });

  const isSubscribed = raw.status === 'subscribed';
  const isGuest = raw.status === 'guest';
  const isTrial = raw.status === 'trial';

  // 프로모 문구 — 구독자는 문구 없이 버튼만(로그아웃 도달 유지).
  let headline: ReactNode;
  if (isGuest) {
    headline = t('promo.guestHeadline');
  } else if (isTrial) {
    // 남은 일수 강조 — 코랄색(부모 요청). 상실 프레이밍은 피함.
    headline = (
      <Trans
        t={t}
        i18nKey="promo.trialHeadline"
        values={{ days: raw.trialDaysLeft }}
        components={{ big: <span className="text-coral-600 text-[1.15em] tabular-nums" /> }}
      />
    );
  } else if (!PAYWALL_ENABLED) {
    headline = t('promo.preOpenHeadline');
  } else {
    headline = t('promo.expiredHeadline');
  }

  const handleSignOut = async () => {
    if (!window.confirm(ts('sidebar.logoutConfirm'))) return;
    await signOut();
  };

  // 공유 — 베타 1년 무료라 레퍼럴 코드가 불필요해졌다. 순수 앱 공유(코드 없음):
  // Web Share API 우선, 미지원(데스크탑 등)이면 링크 복사 폴백.
  const [shared, setShared] = useState(false);
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
      className="w-full rounded-2xl shadow-soft mb-6 px-4 py-2.5 md:py-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 bg-gradient-to-r from-cream-50 to-peach-100"
      role="region"
      aria-label={t('promo.region')}
    >
      {/* 좌 — 프로모 문구 + CTA (구독자는 숨김) */}
      {!isSubscribed && (
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
      )}

      {/* 우 — 홈에 설치 + 로그인/로그아웃 (헤더에서 이 자리로 이동, 라이브러리 한정).
          모바일은 세로 스택이라 버튼 행을 우측 정렬(self-end), sm+ 는 한 행에서 ml-auto. */}
      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto sm:ml-auto">
        <InstallPwaButton className="flex items-center gap-1.5 rounded-full bg-coral-500 px-3 py-1.5 text-xs sm:text-sm font-black text-white shadow-soft transition hover:brightness-110 hover:shadow-pop sm:px-4" />
        {session ? (
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 shadow-soft text-xs sm:text-sm font-black text-ink-600 hover:bg-white hover:text-danger transition-all"
            aria-label={ts('sidebar.logout')}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span className="hidden sm:inline">{ts('sidebar.logout')}</span>
          </button>
        ) : isConfigured ? (
          <Link
            to="/login"
            className="flex items-center gap-1.5 rounded-full bg-coral-500 px-3 py-1.5 shadow-soft text-xs sm:text-sm font-black text-white hover:bg-coral-600 hover:shadow-pop transition-all"
          >
            <span aria-hidden>🔑</span>
            <span>{ts('sidebar.login')}</span>
          </Link>
        ) : null}
      </div>
    </div>
  );
}
