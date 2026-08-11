import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/context/AuthContext';
import { isDevEmail } from '@/config/dev';

/**
 * /library/phonics — 한글/영어 파닉스 선택 페이지.
 *
 * AppShell 안에서 렌더 — 헤더 (파닉스 타이틀) + 본문. 한글·영어는 공개.
 * 🔴 중국어 병음은 아직 기획단계(WIP)라 **dev-only** — 라우트·코드는 살려 두되 카드만 개발자에게만
 *    보인다(2026-08-06 사용자: "아직 기획단계인데 오버햇네"). 열 땐 `isDev` 조건만 지우면 된다.
 *
 * 디자인 (2026-05-20): 코랄/블루 큰 컬러 카드 + 거대 character + 데코 blob.
 * BookDetailPage ModeCard 톤과 일관.
 */
export default function PhonicsLandingPage() {
  const { t } = useTranslation('phonics');
  const { account } = useAuth();
  const isDev = isDevEmail(account?.email);
  return (
    <div className="px-4 sm:px-6 py-6 max-w-[1200px] mx-auto">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-black font-display text-ink-900 mb-1">
        {t('landing.title')}
      </h1>
      <p className="text-sm sm:text-base text-ink-600 font-bold mb-6 sm:mb-8">
        {t('landing.subtitle')}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
        {/* 한글 파닉스 — coral 톤 active */}
        <Link
          to="/library/phonics/korean"
          className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-coral-400 via-coral-500 to-coral-600 shadow-pop hover:shadow-[0_16px_32px_rgba(0,0,0,0.22)] hover:-translate-y-1 active:translate-y-0 transition-all duration-150 aspect-[4/3] md:aspect-[5/4] p-6 sm:p-8 text-white flex flex-col justify-between"
        >
          {/* 데코 blob — 오른쪽 상단 + 왼쪽 하단 */}
          <div
            aria-hidden
            className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/15 blur-2xl"
          />
          <div
            aria-hidden
            className="absolute -bottom-16 -left-10 w-40 h-40 rounded-full bg-coral-300/30 blur-2xl"
          />
          {/* 상단 chip */}
          <div className="relative flex items-center justify-between">
            <span className="px-3 py-1 rounded-full bg-white/25 backdrop-blur-sm text-xs sm:text-sm font-black tracking-wide">
              {t('landing.koreanChip')}
            </span>
            <span className="px-3 py-1 rounded-full bg-white/25 backdrop-blur-sm text-xs sm:text-sm font-black">
              {t('landing.ageRange')}
            </span>
          </div>
          {/* 거대 character */}
          <div className="relative flex items-end justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black font-display leading-tight break-keep">
                {t('landing.koreanTitle')}
              </h2>
              <p className="text-xs sm:text-sm md:text-base font-bold mt-1 text-white/90 break-keep">
                {t('landing.koreanDesc')}
              </p>
              <div className="mt-3 sm:mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-coral-600 font-black text-sm sm:text-base shadow-soft group-hover:shadow-pop transition">
                {t('landing.start')}
                <span className="text-base sm:text-lg">→</span>
              </div>
            </div>
            <img
              src="/icons/phonics/korean.webp"
              alt={t('landing.koreanAlt')}
              className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 object-contain shrink-0 drop-shadow-[0_8px_20px_rgba(0,0,0,0.3)] group-hover:scale-105 transition -mr-2"
            />
          </div>
        </Link>

        {/* 영어 파닉스 */}
        <Link
          to="/library/phonics/english"
          className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-400 via-blue-500 to-blue-600 shadow-soft hover:shadow-pop active:scale-[0.99] transition aspect-[4/3] md:aspect-[5/4] p-6 sm:p-8 text-white flex flex-col justify-between"
        >
          {/* 데코 blob */}
          <div
            aria-hidden
            className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/15 blur-2xl"
          />
          <div
            aria-hidden
            className="absolute -bottom-16 -left-10 w-40 h-40 rounded-full bg-blue-300/30 blur-2xl"
          />
          {/* 상단 chip */}
          <div className="relative flex items-center justify-between">
            <span className="px-3 py-1 rounded-full bg-white/25 backdrop-blur-sm text-xs sm:text-sm font-black tracking-wide">
              ABC
            </span>
            <span className="px-3 py-1 rounded-full bg-white/25 backdrop-blur-sm text-xs sm:text-sm font-black">
              {t('landing.ageRange')}
            </span>
          </div>
          {/* 거대 character */}
          <div className="relative flex items-end justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black font-display leading-tight break-keep">
                {t('landing.englishTitle')}
              </h2>
              <p className="text-xs sm:text-sm md:text-base font-bold mt-1 text-white/90 break-keep">
                {t('landing.englishDesc')}
              </p>
              <div className="mt-3 sm:mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-blue-600 font-black text-sm sm:text-base shadow-soft group-hover:shadow-pop transition">
                {t('landing.start')}
                <span className="text-base sm:text-lg">→</span>
              </div>
            </div>
            <img
              src="/icons/phonics/english.webp"
              alt={t('landing.englishAlt')}
              className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 object-contain shrink-0 drop-shadow-[0_8px_20px_rgba(0,0,0,0.3)] group-hover:scale-105 transition -mr-2"
            />
          </div>
        </Link>

        {/* 중국어 병음 파닉스 — emerald 톤. 🔴 WIP(기획단계) → dev-only. 전용 마스코트 자산 전 임시 拼 글리프. */}
        {isDev && (
          <Link
            to="/library/phonics/chinese"
            className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 shadow-soft hover:shadow-pop active:scale-[0.99] transition aspect-[4/3] md:aspect-[5/4] p-6 sm:p-8 text-white flex flex-col justify-between"
          >
            <div
              aria-hidden
              className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/15 blur-2xl"
            />
            <div
              aria-hidden
              className="absolute -bottom-16 -left-10 w-40 h-40 rounded-full bg-emerald-300/30 blur-2xl"
            />
            <div className="relative flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-white/25 backdrop-blur-sm text-xs sm:text-sm font-black tracking-wide">
                拼音
              </span>
              <span className="px-3 py-1 rounded-full bg-white/25 backdrop-blur-sm text-xs sm:text-sm font-black">
                {t('landing.ageRange')}
              </span>
            </div>
            <div className="relative flex items-end justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black font-display leading-tight break-keep">
                  {t('landing.chineseTitle')}
                </h2>
                <p className="text-xs sm:text-sm md:text-base font-bold mt-1 text-white/90 break-keep">
                  {t('landing.chineseDesc')}
                </p>
                <div className="mt-3 sm:mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-emerald-600 font-black text-sm sm:text-base shadow-soft group-hover:shadow-pop transition">
                  {t('landing.start')}
                  <span className="text-base sm:text-lg">→</span>
                </div>
              </div>
              <span
                aria-hidden
                className="text-6xl sm:text-7xl md:text-8xl font-black font-display shrink-0 drop-shadow-[0_8px_20px_rgba(0,0,0,0.3)] group-hover:scale-105 transition -mr-1"
              >
                拼
              </span>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
