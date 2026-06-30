import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useAccess } from '@/features/access';

/**
 * Single-slide promo banner advertising 7-day free trial / referral bonus.
 *
 * Copy and CTA change based on user state:
 *   - Guest (no account): login prompt
 *   - Trial: days remaining + upgrade nudge
 *   - Expired: subscription nudge
 *   - Subscribed/entitled: hidden (returns null)
 *
 * IMPORTANT: We detect guest via `account === null` from useAuth(), NOT via
 * useAccess().status, because when PAYWALL_ENABLED=false useAccess() returns
 * `status:'subscribed'` for everyone including guests.
 *
 * Asset: public/images/library-banner/promo.webp
 *   1872×1248, tiger mascot + gift on RIGHT half; left ~40% is open cream space.
 */
export function PromoBanner() {
  const navigate = useNavigate();
  const { account } = useAuth();
  const access = useAccess();

  // Determine content based on user state (in priority order)
  let headline: string;
  let sub: string;
  let ctaLabel: string;
  let ctaPath: string;

  if (!account) {
    // Guest — no account at all
    headline = '로그인하면 7일 무료 체험';
    sub = '친구 초대하면 +7일 무료';
    ctaLabel = '로그인하고 시작하기';
    ctaPath = '/login';
  } else if (access.status === 'trial') {
    headline = `무료 체험 ${access.trialDaysLeft}일 남음`;
    sub = '이용권으로 계속 즐겨요';
    ctaLabel = '이용권 보기';
    ctaPath = '/subscribe';
  } else if (access.status === 'expired') {
    headline = '이용권으로 모든 책을 열어요';
    sub = '세계명작·자연관찰 모두';
    ctaLabel = '이용권 보기';
    ctaPath = '/subscribe';
  } else {
    // subscribed / entitled — hide banner entirely
    return null;
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
          <button
            onClick={() => navigate(ctaPath)}
            className="mt-2 md:mt-3 bg-coral-500 text-white font-black rounded-xl px-5 py-2.5 text-xs md:text-sm hover:brightness-110 transition"
          >
            {ctaLabel}
          </button>
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
