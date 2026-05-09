import { useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Mascot, AppIcon } from '@/design-system';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useStorybooks } from '@/features/storybook';
import { cn } from '@/lib/cn';

/**
 * 학습자 화면 공통 frame — 좌측 nav (3축 + More Fun) + 상단 헤더 (페이지 타이틀 + 별).
 * 진입점 페이지에만 적용 (deep view 인 viewer/editor/게임 플레이어는 제외).
 *
 * 디자인 타겟: 태블릿 1024-1366 + 4-5세 사용자 → 큰 글자, 큰 터치 타겟, 빈 공간 최소화.
 */
/**
 * 사이드바 메인 axis — 3축 모두 동일 정사각 박스 디자인 (정렬 통일).
 * MVP: 동화책만 active (책 상세/뷰어 어디든 alwaysActive). 파닉스/어휘는 comingSoon 음영 (코드/라우트는 보존).
 */
const PRIMARY_AXES = [
  {
    to: '/library',
    iconSrc: 'tab/storybook.svg',
    label: '동화책',
    color: 'coral' as const,
    end: true,
    comingSoon: false,
    alwaysActive: true,
  },
  {
    to: '/library/phonics',
    iconSrc: 'tab/phonics.svg',
    label: '파닉스',
    color: 'mint' as const,
    end: false,
    comingSoon: true,
    alwaysActive: false,
  },
  {
    to: '/vocabulary',
    iconSrc: 'tab/vocab.svg',
    label: '어휘',
    color: 'amber' as const,
    end: false,
    comingSoon: true,
    alwaysActive: false,
  },
];

/**
 * 페이지 path → 큰 타이틀 (SVG 아이콘 path + 텍스트) 매핑.
 * 이모지 대신 디자인 시스템 SVG 사용 — 가독성 + 톤 일관성.
 * 매칭되는 SVG 가 없으면 emoji 폴백.
 */
function getPageTitle(
  pathname: string
): { iconSrc?: string; emoji?: string; title: string } | null {
  // /library 는 LibraryPage 자체가 hero 배너에 큰 제목 노출 → AppShell 헤더 중복 hide
  if (pathname === '/library') return null;
  if (pathname.startsWith('/library/phonics'))
    return { iconSrc: 'tab/phonics.svg', title: '파닉스' };
  if (pathname.startsWith('/vocabulary/book-'))
    return { iconSrc: 'tab/vocab.svg', title: '단어 익히기' };
  if (pathname.startsWith('/vocabulary')) return { iconSrc: 'tab/vocab.svg', title: '어휘 마스터' };
  if (pathname.startsWith('/parent')) return { emoji: '👨‍👩‍👧', title: '부모님 모드' };
  return null;
}

export function AppShell() {
  const { activeProfile, session, signOut, isConfigured } = useAuth();
  // v1 단일화 — 사이드바 헤더 카운트도 v1 기준 (B-2 sweep 잔재 정리).
  const { data: storybooks } = useStorybooks();
  const location = useLocation();
  const bookCount = storybooks?.filter((b) => b.isPublic).length ?? 0;
  const pageTitle = getPageTitle(location.pathname);
  // 단원 학습 화면(/vocabulary/:unitId)은 가운데 호리+말풍선이 본문 시선을 가져가야 해서 사이드바 호리 숨김
  const hideSidebarMascot = /^\/vocabulary\/[^/]+/.test(location.pathname);
  // 라이브러리는 hero 배경이 헤더 영역까지 차지 — AppShell 헤더 transparent + 우측 사용자 chip 만 floating
  const isLibraryRoot = location.pathname === '/library';

  // 학습자 화면은 라이트 모드 고정
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  const handleSignOut = async () => {
    if (!window.confirm('로그아웃할까요?')) return;
    await signOut();
  };

  // 인사말 — /library 는 hero 배너에 권수 노출 (중복 회피). 다른 진입점에서만 fallback (현재 경로 매칭 없으니 사실상 비활성)
  const greeting = '';

  return (
    <div className="flex min-h-screen bg-cream-50">
      {/* 좌측 nav — 태블릿 기준 w-44 (176px). 박스 + 라벨 가독성 우선. */}
      <aside className="w-44 flex-shrink-0 sticky top-0 h-screen flex flex-col bg-cream-50 border-r border-ink-100/60">
        {/* 로고 영역 — 워드마크 이미지 (1774x887 원본 → 사이드바 폭 176 안에 fit, h-12 ≈ 48px / w 자동) */}
        <div className="h-20 flex items-center justify-center px-3 border-b border-ink-100/40">
          <img src="/logo/logo-kr.png" alt="탱고북" className="h-12 w-auto object-contain" />
        </div>

        {/* 3 axis — 모두 동일 정사각 박스 (정렬 통일). 동화책 / 파닉스 / 어휘 */}
        <nav className="flex flex-col gap-3 items-center pt-5">
          {PRIMARY_AXES.map((axis) => (
            <PrimaryNavButton key={axis.to} {...axis} />
          ))}
        </nav>

        {/* 하단 호리 인사 — waving (덜 reactive) + 메시지. 단원 학습 화면에선 본문 호리와 중복이라 spacer만 유지 */}
        <div className="mt-auto flex flex-col items-center pb-3">
          {!hideSidebarMascot && (
            <>
              <Mascot character="hori" state="waving" size="lg" />
              <div className="mt-1 px-3 py-1.5 rounded-2xl bg-coral-100 text-coral-700 text-sm font-black text-center shadow-soft">
                오늘도 만나서 반가워! 👋
              </div>
            </>
          )}
        </div>

        <div className="px-3 pb-3 pt-3 border-t border-ink-100/60">
          {isConfigured && <SecondaryNavButton to="/parent" emoji="🔒" label="부모" />}
        </div>
      </aside>

      {/* 우측 영역. /library 일 때 header = absolute overlay → main 이 0부터 시작 → hero 가 헤더 영역까지 차지. */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <header
          className={cn(
            'h-20 z-30 px-7 flex items-center justify-between',
            isLibraryRoot
              ? 'absolute top-0 inset-x-0 bg-transparent border-b-0 pointer-events-none'
              : 'sticky top-0 bg-cream-50 border-b border-ink-100/60'
          )}
        >
          {/* 왼쪽: 페이지 타이틀 (큰 글자) + 인사말 sub */}
          <div className="flex items-center gap-3 min-w-0">
            {pageTitle && (
              <h1 className="text-2xl md:text-3xl font-black font-display text-ink-900 truncate flex items-center gap-2">
                {pageTitle.iconSrc ? (
                  <AppIcon src={pageTitle.iconSrc} size={36} alt={pageTitle.title} />
                ) : pageTitle.emoji ? (
                  <span>{pageTitle.emoji}</span>
                ) : null}
                <span>{pageTitle.title}</span>
              </h1>
            )}
            {greeting && (
              <span className="text-base font-bold text-ink-500 hidden sm:inline">{greeting}</span>
            )}
          </div>

          {/* 오른쪽: 프로필 + 로그아웃. /library transparent 헤더 위에서도 클릭 가능. */}
          <div className="flex items-center gap-3 flex-shrink-0 pointer-events-auto">
            {activeProfile && (
              <div className="px-4 py-2 rounded-full bg-white shadow-soft text-sm font-black text-ink-900">
                👦 {activeProfile.name}
              </div>
            )}
            {session && (
              <button
                onClick={handleSignOut}
                className="w-10 h-10 rounded-full bg-white shadow-soft text-ink-500 hover:text-danger hover:shadow-pop transition flex items-center justify-center"
                title="로그아웃"
                aria-label="로그아웃"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

type AxisColor = 'coral' | 'mint' | 'amber' | 'violet';

const COLOR_ACTIVE: Record<AxisColor, string> = {
  coral: 'bg-coral-500 text-white shadow-pop ring-4 ring-coral-200',
  mint: 'bg-success text-white shadow-pop ring-4 ring-success/30',
  amber: 'bg-warn text-ink-900 shadow-pop ring-4 ring-warn/40',
  violet: 'bg-violet-500 text-white shadow-pop ring-4 ring-violet-200',
};

const COLOR_IDLE: Record<AxisColor, string> = {
  coral: 'bg-coral-100 text-coral-600 hover:bg-coral-200',
  mint: 'bg-success/15 text-success hover:bg-success/25',
  amber: 'bg-warn/20 text-ink-900 hover:bg-warn/30',
  violet: 'bg-violet-100 text-violet-600 hover:bg-violet-200',
};

function PrimaryNavButton({
  to,
  iconSrc,
  label,
  color,
  end,
  comingSoon,
  alwaysActive,
}: {
  to: string;
  iconSrc: string;
  label: string;
  color: AxisColor;
  end: boolean;
  comingSoon?: boolean;
  alwaysActive?: boolean;
}) {
  if (comingSoon) {
    // 차분한 disabled 톤 — 카드 음영 + sub-label "준비 중" (배지 대신)
    return (
      <div
        role="button"
        aria-disabled="true"
        title="준비 중이에요"
        className="w-28 h-28 rounded-3xl flex flex-col items-center justify-center gap-1 bg-ink-100/40 cursor-not-allowed select-none"
      >
        <AppIcon src={iconSrc} size={44} alt={label} className="opacity-35" />
        <span className="text-base font-black text-ink-500">{label}</span>
        <span className="text-[11px] font-black text-ink-400 tracking-wide">준비 중</span>
      </div>
    );
  }
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => {
        const showActive = alwaysActive || isActive;
        return cn(
          'w-28 h-28 rounded-3xl flex flex-col items-center justify-center gap-1.5 transition-all font-black',
          showActive ? COLOR_ACTIVE[color] : COLOR_IDLE[color],
          !showActive && 'hover:scale-105'
        );
      }}
    >
      <AppIcon src={iconSrc} size={48} alt={label} />
      <span className="text-base">{label}</span>
    </NavLink>
  );
}

function SecondaryNavButton({
  to,
  iconSrc,
  emoji,
  label,
}: {
  to: string;
  iconSrc?: string;
  emoji?: string;
  label: string;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-base font-black transition-all',
          isActive ? 'bg-white text-ink-900 shadow-soft' : 'text-ink-700 hover:bg-white/60'
        )
      }
    >
      {iconSrc ? (
        <AppIcon src={iconSrc} size={28} alt={label} className="rounded" />
      ) : (
        <span className="text-2xl">{emoji}</span>
      )}
      <span>{label}</span>
    </NavLink>
  );
}
