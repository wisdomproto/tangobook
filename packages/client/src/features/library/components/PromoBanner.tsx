import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { computeAccess } from '@tangobook/shared';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useEntitlement } from '@/features/payment/hooks/useEntitlement';
import { PAYWALL_ENABLED } from '@/features/access/config';
import { useGuestMode } from '@/features/access/hooks/useGuestMode';
import { InstallPwaButton } from '@/components/InstallPwaButton';

const SHARE_URL = 'https://www.tangobook.co.kr';

/**
 * Slim promo bar for the library top — one low row, no mascot art.
 *   left  = promo copy + CTA (guest signup / share)
 *   right = 홈에 설치 (+ 로그인 when logged out) — **desktop only**
 *
 * Copy changes from account age + real subscription data (decoupled from
 * PAYWALL_ENABLED so the countdown shows before paywall goes live):
 *   - guest   → "1 year free" signup hook, or "게스트 N일 남음" during the guest window
 *   - trial   → days remaining + share button (beta = 1yr free, referral moot)
 *   - expired → subscribe hook + share button
 *   - subscribed → promo text hidden, bar keeps the install button
 *
 * 🔴 Where the chrome lives, so it never doubles up (2026-07-25):
 *   mobile  → AppShell header (hamburger + logo + 설치 + 프로필 칩); this bar shows promo only
 *   desktop → header collapses on /library, sidebar holds the profile chip and
 *             the parent menu holds 로그아웃 → this bar holds 설치/로그인
 */
export function PromoBanner() {
  const { t } = useTranslation('access');
  const { t: ts } = useTranslation('shell');
  const navigate = useNavigate();
  const { account, session, isConfigured } = useAuth();
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

  const isSubscribed = raw.status === 'subscribed';
  const isGuest = raw.status === 'guest';
  const isTrial = raw.status === 'trial';

  // 프로모 문구 — 구독자는 문구 없이 버튼만(로그아웃 도달 유지).
  let headline: ReactNode;
  if (isGuest && guestMode.active) {
    // 게스트 모드 30일 창 — 남은 일수를 보여줘 가입 전환을 재촉(CTA 는 그대로 가입).
    headline = t('entryGate.guestDays', { days: guestMode.daysLeft });
  } else if (isGuest) {
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

      {/* 우 — 홈에 설치 + (미로그인) 로그인.
          🔴 모바일에선 숨긴다 — 그쪽은 헤더 우상단이 설치·프로필 칩을 갖고, 배너는 한 줄 프로모만
          남겨 상단이 3겹이 되지 않게 한다. 데스크탑 라이브러리는 헤더가 접히므로 여기가 그 자리.
          🔴 로그아웃·프로필 칩은 여기 없다 — 데스크탑엔 사이드바(칩)+부모 메뉴(로그아웃)가 있다. */}
      <div className="hidden shrink-0 items-center gap-2 sm:ml-auto md:flex">
        <InstallPwaButton className="flex items-center gap-1.5 rounded-full bg-coral-500 px-3 py-1.5 text-xs sm:text-sm font-black text-white shadow-soft transition hover:brightness-110 hover:shadow-pop sm:px-4" />
        {!session && isConfigured ? (
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
