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
      {/* 🔴 **한 컨테이너 안에서 정렬한다.** pill 줄을 `max-w-6xl` 래퍼 밖에 두었더니 모바일에선
          멀쩡한데 데스크탑에서 로고는 가운데 정렬, 칩은 화면 맨 왼쪽 끝에 붙어 서로 다른 축으로
          어긋났다. 두 줄이 같은 왼쪽 선에서 시작해야 한다. */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-center gap-3 py-2 sm:gap-6 sm:py-2.5">
          <Link to="/" aria-label="탱고북 홈" className="shrink-0">
            <img
              src="/logo/logo-kr-520.webp"
              alt="탱고북"
              width={1774}
              height={887}
              className="h-8 w-auto sm:h-10"
            />
          </Link>

          {/* 🔴 데스크탑은 **한 줄** — 벤치마크(Epic·HOMER)가 전부 로고 옆에 메뉴를 둔다.
              모바일은 폭이 없어 아래 줄로 내린다. */}
          <nav aria-label="탱고북 둘러보기" className="hidden gap-1 sm:flex">
            {LINKS.map((l) => (
              <NavChip key={l.to} to={l.to} label={l.label} pathname={pathname} />
            ))}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-4">
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
              {session ? '내 서재' : '결제 정보 없이 한 달 무료'}
            </Link>
          </div>
        </div>

        {/* 🔴 모바일 전용 둘째 줄. 패딩 밖으로 흘려 마지막 칩이 살짝 걸쳐 보이게 —
            딱 떨어지면 옆에 더 있다는 신호가 사라진다. */}
        <nav
          aria-label="탱고북 둘러보기"
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:hidden [&::-webkit-scrollbar]:hidden"
        >
          {LINKS.map((l) => (
            <NavChip key={l.to} to={l.to} label={l.label} pathname={pathname} />
          ))}
        </nav>
      </div>
    </div>
  );
}

function NavChip({ to, label, pathname }: { to: string; label: string; pathname: string }) {
  const on = pathname === to || pathname.startsWith(to + '/');
  return (
    <Link
      to={to}
      aria-current={on ? 'page' : undefined}
      className={`inline-flex min-h-[32px] shrink-0 items-center rounded-full border-2 px-3.5 text-[12.5px] font-extrabold transition sm:min-h-[38px] sm:border-0 sm:px-3 sm:text-[15px] ${
        on
          ? 'border-coral-500 bg-coral-500 text-white sm:bg-transparent sm:text-coral-700'
          : 'border-line bg-white text-ink-700 hover:border-coral-300 sm:bg-transparent sm:text-ink-700 sm:hover:text-coral-700'
      }`}
    >
      {label}
    </Link>
  );
}
