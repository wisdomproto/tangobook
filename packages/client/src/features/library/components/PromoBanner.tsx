import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { computeAccess } from '@tangobook/shared';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useEntitlement } from '@/features/payment/hooks/useEntitlement';
import { PAYWALL_ENABLED } from '@/features/access/config';
import { useGuestMode } from '@/features/access/hooks/useGuestMode';
import { InstallPwaButton } from '@/components/InstallPwaButton';
import { cn } from '@/lib/cn';

const SHARE_URL = 'https://www.tangobook.co.kr';

/**
 * Slim promo bar for the library top — one low row, no mascot art.
 *   left  = promo copy + CTA (guest signup / share)
 *   right = 홈에 설치 (+ 로그인 when logged out) — **desktop only**
 *
 * 🔴 The promo only shows to someone with something left to convert:
 *   - guest   → "1 year free" signup hook, or "게스트 N일 남음" during the guest window
 *   - expired → subscribe hook + share button
 *   - signed up (trial / beta year / subscribed) → no promo. They already have the
 *     benefit, so a "무료 체험 423일 남음" countdown is just noise. With nothing left
 *     in the bar on mobile, the whole thing hides there.
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

  const isGuest = raw.status === 'guest';
  const isExpired = raw.status === 'expired';

  // 🔴 프로모는 **아직 전환할 게 남은 사람에게만** 보여준다(2026-07-25).
  // 이미 가입한 사용자는 베타 1년 무료를 갖고 있어 "무료 체험 423일 남음" 같은 카운트다운이
  // 할 일 없는 소음이 된다 → 게스트(가입 유도)와 만료(구독 유도)만 노출.
  const showPromo = isGuest || (isExpired && PAYWALL_ENABLED);

  let headline: ReactNode = null;
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
      className={cn(
        'w-full rounded-2xl shadow-soft mb-6 px-4 py-2.5 md:py-3 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 bg-gradient-to-r from-cream-50 to-peach-100',
        // 프로모가 없으면(가입 완료 사용자) 남는 건 데스크탑 전용 버튼뿐 →
        // 모바일에선 빈 바가 되므로 통째로 숨긴다.
        showPromo ? 'flex' : 'hidden md:flex'
      )}
      role="region"
      aria-label={t('promo.region')}
    >
      {/* 좌 — 프로모 문구 + CTA. 가입 완료(체험/구독) 사용자는 전환할 게 없어 숨김. */}
      {showPromo && (
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
