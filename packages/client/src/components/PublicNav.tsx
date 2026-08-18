import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';

/**
 * 가입 전 사람이 보는 공용 네비 — 소개(`/`)와 활동 페이지들이 같이 쓴다.
 *
 * 🔴 **모바일에서 햄버거에 넣지 않는다.** 우리 고객은 대개 아이 하나 키우는 초보 엄마고,
 *    햄버거는 안 눌러본다. 가로 스크롤 pill 줄로 깔되 라이브러리 캐러셀과 같은 규칙으로
 *    **오른쪽 칩이 살짝 걸쳐** 보여야 「옆에 더 있다」가 전달된다.
 * 🔴 **로그인과 CTA 를 가른다.** 헤더의 기존 라벨이 「로그인 / 회원가입」 한 덩어리라 그대로
 *    두고 [무료 시작]을 옆에 놓으면 **같은 행동을 두 번** 시킨다 — 프로모 CTA 와 겹쳐서
 *    게스트용 CTA 를 걷어낸 적이 있다. 로그인은 작은 텍스트(기존 회원), CTA 는 코랄 버튼(신규).
 * 🔴 **pill 이름은 우리 머릿속 낱말이 아니라 실제로 치는 낱말로** — 네이버 실측에서
 *    「숨은그림」 110 vs 「숨은그림찾기」 10,970, 「색칠공부프린트」 20 vs 「색칠공부도안」 8,980.
 * 🔴 「학습하기」는 **무엇을 배우는지 라벨에 박지 않는다** — 다국어라 베트남 아이가 한글을 배우고
 *    한국 아이가 영어를 배운다. 앱에 들어가면 사이드바가 3축으로 갈라 주므로 여기서 미리 안 편다.
 */
const LINKS: { to: string; label: string }[] = [
  { to: '/library', label: '학습하기' },
  { to: '/worksheet', label: '활동지' },
  { to: '/games/vocab', label: '어휘 게임' },
  // 🔜 페이지가 서면 여기 두 줄 — 링크를 먼저 걸면 방문자가 404 를 본다.
  // { to: '/games/coloring', label: '색칠 도안' },
  // { to: '/games/hidden', label: '숨은그림찾기' },
];

export function PublicNav() {
  const { session } = useAuth();
  const { pathname } = useLocation();

  return (
    <div className="sticky top-0 z-40 border-b border-line/60 bg-cream-50/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-1.5 sm:px-6 sm:py-2.5">
        <Link to="/" className="shrink-0 font-display text-lg font-black text-ink-900 sm:text-xl">
          탱고북
        </Link>
        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          {!session && (
            <Link
              to="/login"
              className="text-[13px] font-bold text-ink-500 underline-offset-2 hover:underline sm:text-sm"
            >
              로그인
            </Link>
          )}
          <Link
            to={session ? '/library' : '/login?mode=signup'}
            className="inline-flex min-h-[36px] items-center rounded-full bg-coral-700 px-3.5 text-[12.5px] font-extrabold text-white transition hover:bg-coral-800 sm:min-h-[44px] sm:px-5 sm:text-sm"
          >
            {session ? '내 서재' : '한 달 무료 시작'}
          </Link>
        </div>
      </div>

      {/* 🔴 페이지 패딩 밖으로 흘린다 — 안에 가두면 375px 에서 줄 폭이 343px 뿐이라 마지막 칩이
          딱 떨어져 걸침이 0 이 되고, 그러면 옆에 더 있다는 신호가 사라진다. */}
      <nav
        aria-label="탱고북 둘러보기"
        className="flex gap-2 overflow-x-auto px-4 pb-1.5 [scrollbar-width:none] sm:px-6 sm:pb-2.5 [&::-webkit-scrollbar]:hidden"
      >
        {LINKS.map((l) => {
          const on = pathname === l.to || pathname.startsWith(l.to + '/');
          return (
            <Link
              key={l.to}
              to={l.to}
              aria-current={on ? 'page' : undefined}
              className={`inline-flex min-h-[32px] shrink-0 items-center rounded-full border-2 px-3.5 text-[12.5px] sm:min-h-[36px] sm:px-4 font-extrabold transition sm:text-sm ${
                on
                  ? 'border-coral-500 bg-coral-500 text-white'
                  : 'border-line bg-white text-ink-700 hover:border-coral-300'
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
