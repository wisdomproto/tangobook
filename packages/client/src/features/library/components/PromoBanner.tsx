import { useNavigate } from 'react-router-dom';
import { computeAccess } from '@tangobook/shared';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useEntitlement } from '@/features/payment/hooks/useEntitlement';
import { InviteButton } from '@/features/payment';

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
  const navigate = useNavigate();
  const { account } = useAuth();
  const { paidUntil, referralBonusDays } = useEntitlement();

  // Compute access state directly from account + real subscription data,
  // NOT via useAccess() which returns 'subscribed' for everyone when PAYWALL_ENABLED=false.
  const raw = computeAccess({
    account: account ? { createdAt: account.createdAt } : null,
    subscription: paidUntil ? { status: 'active', currentPeriodEnd: paidUntil } : null,
    referralBonusDays,
  });

  // Real paid subscriber — hide banner entirely
  if (raw.status === 'subscribed') return null;

  const isGuest = raw.status === 'guest';
  const isTrial = raw.status === 'trial';

  let headline: string;
  let sub: string;

  if (isGuest) {
    headline = '로그인하면 7일 무료 체험';
    sub = '친구 초대하면 +7일 무료';
  } else if (isTrial) {
    headline = `무료 체험 ${raw.trialDaysLeft}일 남음`;
    sub = '친구 초대하면 +7일 늘어나요';
  } else {
    // expired
    headline = '친구 초대하고 무료 기간 늘리기';
    sub = '친구가 가입하면 +7일';
  }

  return (
    <div
      className="relative w-full aspect-[4/1] md:aspect-[5/1] lg:aspect-[6/1] rounded-2xl overflow-hidden shadow-soft mb-8 md:mb-10 flex bg-gradient-to-br from-cream-50 to-peach-100"
      role="region"
      aria-label="프로모션 배너"
    >
      {/* Left zone — text overlay on the open cream area */}
      <div className="relative w-1/2 shrink-0 flex items-center pl-14 pr-3 sm:pl-16 sm:pr-4 md:pl-20 md:pr-6 z-10">
        <div className="flex-1 min-w-0">
          <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-black font-display text-ink-900 leading-tight break-keep">
            {headline}
          </h2>
          <p className="hidden sm:block text-xs md:text-sm lg:text-base font-bold text-ink-600 mt-1 md:mt-2 leading-snug break-keep">
            {sub}
          </p>
          {isGuest ? (
            <button
              onClick={() => navigate('/login')}
              className="mt-2 md:mt-3 bg-coral-500 text-white font-black rounded-xl px-5 py-2.5 text-xs md:text-sm hover:brightness-110 transition"
            >
              로그인하고 시작하기
            </button>
          ) : (
            <InviteButton className="mt-2 md:mt-3 bg-coral-500 text-white font-black rounded-xl px-5 py-2.5 text-xs md:text-sm hover:brightness-110 transition" />
          )}
        </div>
      </div>

      {/* Right zone — promo illustration with left-edge fade mask */}
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
    </div>
  );
}
