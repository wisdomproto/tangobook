import { Link } from 'react-router-dom';

/**
 * /library/phonics — 한글/영어 파닉스 선택 페이지.
 *
 * AppShell 안에서 렌더 — 헤더 (파닉스 타이틀) + 본문 (2 카드).
 * 영어 파닉스는 MVP 에서 준비 중 음영.
 */
export default function PhonicsLandingPage() {
  return (
    <div className="px-6 py-6 max-w-[1100px] mx-auto">
      <h1 className="text-2xl sm:text-3xl font-black text-ink-900 mb-1">파닉스 학습</h1>
      <p className="text-sm sm:text-base text-ink-600 font-bold mb-6">
        어떤 글자를 배워볼까요? 카드를 눌러 시작하세요.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Link
          to="/library/phonics/korean"
          className="group relative block rounded-3xl bg-gradient-to-br from-cream-100 to-peach-200 shadow-soft hover:shadow-pop active:scale-[0.98] transition border-[5px] border-white overflow-hidden p-6 sm:p-7"
        >
          <div className="text-6xl sm:text-7xl mb-3">가</div>
          <h2 className="text-2xl sm:text-3xl font-black font-display text-ink-900 mb-1">
            한글 파닉스
          </h2>
          <p className="text-sm sm:text-base font-bold text-ink-700">
            모음·자음·받침을 차근차근 배워요
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-coral-500 text-white font-black text-sm shadow-soft">
            시작하기 →
          </div>
        </Link>

        <div
          className="relative block rounded-3xl bg-gradient-to-br from-cream-100 to-mint-100 border-[5px] border-white p-6 sm:p-7 opacity-60 cursor-not-allowed select-none"
          aria-disabled="true"
        >
          <div className="text-6xl sm:text-7xl mb-3">A</div>
          <h2 className="text-2xl sm:text-3xl font-black font-display text-ink-900 mb-1">
            영어 파닉스
          </h2>
          <p className="text-sm sm:text-base font-bold text-ink-700">알파벳 음가부터 단어까지</p>
          <div className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-ink-300 text-ink-700 font-black text-sm">
            준비 중
          </div>
        </div>
      </div>
    </div>
  );
}
