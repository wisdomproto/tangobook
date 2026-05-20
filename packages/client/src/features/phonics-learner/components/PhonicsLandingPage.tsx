import { Link } from 'react-router-dom';

/**
 * /library/phonics — 한글/영어 파닉스 선택 페이지.
 *
 * AppShell 안에서 렌더 — 헤더 (파닉스 타이틀) + 본문 (2 카드).
 * 영어 파닉스는 MVP 에서 준비 중 음영.
 *
 * 디자인 (2026-05-20): 코랄/블루 큰 컬러 카드 + 거대 character + 데코 blob.
 * BookDetailPage ModeCard 톤과 일관.
 */
export default function PhonicsLandingPage() {
  return (
    <div className="px-4 sm:px-6 py-6 max-w-[1200px] mx-auto">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-black font-display text-ink-900 mb-1">
        파닉스 학습
      </h1>
      <p className="text-sm sm:text-base text-ink-600 font-bold mb-6 sm:mb-8">
        어떤 글자를 배워볼까요? 카드를 눌러 시작하세요.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
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
              한글
            </span>
            <span className="px-3 py-1 rounded-full bg-white/25 backdrop-blur-sm text-xs sm:text-sm font-black">
              4-7세
            </span>
          </div>
          {/* 거대 character */}
          <div className="relative flex items-end justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black font-display leading-tight break-keep">
                한글 파닉스
              </h2>
              <p className="text-xs sm:text-sm md:text-base font-bold mt-1 text-white/90 break-keep">
                모음 · 자음 · 받침을 차근차근
              </p>
              <div className="mt-3 sm:mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-coral-600 font-black text-sm sm:text-base shadow-soft group-hover:shadow-pop transition">
                시작하기
                <span className="text-base sm:text-lg">→</span>
              </div>
            </div>
            <img
              src="/icons/phonics/korean.webp"
              alt="한글 파닉스 호리"
              className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 object-contain shrink-0 drop-shadow-[0_8px_20px_rgba(0,0,0,0.3)] group-hover:scale-105 transition -mr-2"
            />
          </div>
        </Link>

        {/* 영어 파닉스 — blue 톤 active */}
        <Link
          to="/library/phonics/english"
          className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-400 via-blue-500 to-blue-600 shadow-pop hover:shadow-[0_16px_32px_rgba(0,0,0,0.22)] hover:-translate-y-1 active:translate-y-0 transition-all duration-150 aspect-[4/3] md:aspect-[5/4] p-6 sm:p-8 text-white flex flex-col justify-between"
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
              4-7세
            </span>
          </div>
          {/* 거대 character */}
          <div className="relative flex items-end justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black font-display leading-tight break-keep">
                영어 파닉스
              </h2>
              <p className="text-xs sm:text-sm md:text-base font-bold mt-1 text-white/90 break-keep">
                알파벳 음가부터 단어까지
              </p>
              <div className="mt-3 sm:mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-blue-600 font-black text-sm sm:text-base shadow-soft group-hover:shadow-pop transition">
                시작하기
                <span className="text-base sm:text-lg">→</span>
              </div>
            </div>
            <img
              src="/icons/phonics/english.webp"
              alt="영어 파닉스 호리"
              className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 object-contain shrink-0 drop-shadow-[0_8px_20px_rgba(0,0,0,0.3)] group-hover:scale-105 transition -mr-2"
            />
          </div>
        </Link>
      </div>
    </div>
  );
}
