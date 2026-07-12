import { useEffect, useState } from 'react';
import { Outlet, NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppIcon } from '@/design-system';
import { useAuth } from '@/features/auth/context/AuthContext';
import { ProfilePicker } from '@/features/auth/components/ProfilePicker';
import { AppBgm } from './AppBgm';
import { UiLangMenu } from './UiLangMenu';
import { AvatarRender } from '@/features/auth/components/AvatarRender';
import { cn } from '@/lib/cn';
import { isDevEmail } from '@/config/dev';
import { TrialBadge } from '@/features/access/components/TrialBadge';

/**
 * 학습자 화면 공통 frame — 좌측 nav (3축 + More Fun) + 상단 헤더 (페이지 타이틀 + 별).
 * 진입점 페이지에만 적용 (deep view 인 viewer/editor/게임 플레이어는 제외).
 *
 * 디자인 타겟: 태블릿 1024-1366 + 4-5세 사용자 → 큰 글자, 큰 터치 타겟, 빈 공간 최소화.
 * 모바일 (<md / <768px): 사이드바 hide → 헤더 좌상단 햄버거 → 슬라이드 드로어. 320px 부터 지원.
 */
/**
 * 사이드바 메인 axis — 3축 모두 동일 정사각 박스 디자인 (정렬 통일).
 * MVP: 동화책만 active (책 상세/뷰어 어디든 alwaysActive). 파닉스/어휘는 comingSoon 음영 (코드/라우트는 보존).
 */
const PRIMARY_AXES = [
  {
    to: '/library',
    iconSrc: 'tab/storybook.svg',
    labelKey: 'sidebar.storybooks',
    color: 'coral' as const,
    end: true,
    comingSoon: false,
    alwaysActive: true,
    devOnly: false,
    authOnly: false,
  },
  // 연속재생은 부모가 세팅하는 작업이라 사이드바 아이존이 아닌 메인화면(라이브러리 "나의 재생 목록")
  // 이 1차 진입점 — PlaylistLibrarySection 이 로그인 시 항상 표시(빈 상태 CTA 포함). 2026-07-07.
  {
    // 어휘 게임 — 세계명작 낱말 랜덤 풀 블록 게임. 허브에서 한글/영어 선택. 2026-07-08 부활.
    to: '/games/vocab',
    iconSrc: 'game/korean-block.webp',
    labelKey: 'sidebar.vocabGames',
    color: 'mint' as const,
    end: false,
    comingSoon: false,
    alwaysActive: false,
    devOnly: false,
    authOnly: false,
  },
  {
    to: '/library/phonics',
    iconSrc: 'tab/phonics.svg',
    labelKey: 'sidebar.phonics',
    color: 'mint' as const,
    end: false,
    comingSoon: false,
    alwaysActive: false,
    devOnly: true,
    authOnly: false,
  },
  {
    to: '/vocabulary',
    iconSrc: 'tab/vocab.svg',
    labelKey: 'sidebar.vocabulary',
    color: 'amber' as const,
    end: false,
    comingSoon: true,
    alwaysActive: false,
    devOnly: true,
    authOnly: false,
  },
  {
    to: '/games',
    iconSrc: 'game/korean-block.webp',
    labelKey: 'sidebar.learningGames',
    color: 'violet' as const,
    end: false,
    comingSoon: false,
    alwaysActive: false,
    devOnly: true,
    authOnly: false,
  },
];

/**
 * 페이지 path → 큰 타이틀 (SVG 아이콘 path + 텍스트) 매핑.
 * 이모지 대신 디자인 시스템 SVG 사용 — 가독성 + 톤 일관성.
 * 매칭되는 SVG 가 없으면 emoji 폴백.
 */
function getPageTitle(
  pathname: string
): { iconSrc?: string; emoji?: string; titleKey: string } | null {
  // /library 는 LibraryPage 자체가 hero 배너에 큰 제목 노출 → AppShell 헤더 중복 hide
  if (pathname === '/library') return null;
  if (pathname.startsWith('/library/phonics'))
    return { iconSrc: 'tab/phonics.svg', titleKey: 'pageTitle.phonics' };
  if (pathname.startsWith('/vocabulary/book-'))
    return { iconSrc: 'tab/vocab.svg', titleKey: 'pageTitle.wordStudy' };
  if (pathname.startsWith('/vocabulary'))
    return { iconSrc: 'tab/vocab.svg', titleKey: 'pageTitle.vocabMaster' };
  if (pathname.startsWith('/parent')) return { emoji: '👨‍👩‍👧', titleKey: 'pageTitle.parentMode' };
  return null;
}

export function AppShell() {
  const { t } = useTranslation('shell');
  const { activeProfile, setActiveProfile, profiles, session, signOut, isConfigured, account } =
    useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  // 아이 2명 이상인데 아직 아무도 선택 안 됨 → 학습자 화면 진입 전 "누가 놀고 있어요?" 게이트.
  // (1명이면 useActiveProfile 이 자동 선택하므로 이 게이트는 뜨지 않음.)
  const needsProfilePick = !!session && profiles.length > 1 && !activeProfile;
  const pageTitle = getPageTitle(location.pathname);
  // /library 는 배너가 viewport top 까지 차지 — 헤더 absolute overlay (transparent) 로
  // main 이 0부터 시작. 우상단 chip 만 pointer-events-auto 로 클릭 가능.
  const isLibraryRoot = location.pathname === '/library';
  const [drawerOpen, setDrawerOpen] = useState(false);

  // 학습자 화면은 라이트 모드 고정
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  // 라우트 변경 시 드로어 자동 close
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    if (!window.confirm(t('sidebar.logoutConfirm'))) return;
    await signOut();
  };

  const sidebarContent = (
    <>
      {/* 로고 영역 — 사이드바 좌상단. 헤더 height(80px) 와 정렬. */}
      <div className="h-20 flex items-center justify-center px-2 border-b border-ink-100/40">
        <Link to="/library" aria-label={t('logo.home')}>
          <img
            src="/logo/logo-kr.webp"
            alt={t('logo.alt')}
            className="h-14 w-auto object-contain"
          />
        </Link>
      </div>

      {/* 아이 zone — 동화책(아이가 매일 만지는 유일한 것) + 파닉스 / 어휘 / 학습 게임 (개발자 전용).
          부모 작업(리포팅·초대·연속재생·설정)은 위계를 정직하게 하려고 하단 부모 영역으로 분리. 2026-07-07. */}
      <nav className="flex flex-col gap-2.5 items-center pt-5 pb-5">
        {PRIMARY_AXES.filter(
          (a) => (!a.devOnly || isDevEmail(account?.email)) && (!a.authOnly || !!session)
        ).map((axis) => (
          <PrimaryNavButton key={axis.to} {...axis} label={t(axis.labelKey)} />
        ))}
      </nav>

      {/* 부모 영역 — 부모 설정 / 로그인/로그아웃. */}
      <div className="mt-auto px-3 pt-3 pb-3 border-t-2 border-ink-200/60 bg-cream-100/30 flex flex-col gap-1.5">
        {/* 무료 체험 남은 일수 — 로그인 시 상시 노출(배너 스크롤/캐시와 무관) */}
        {session && isConfigured && <TrialBadge />}
        {/* 부모 도메인 작업 — 학습 리포팅 · 친구 초대 · 부모 설정 을 한 곳에 모아 위계 정직화. 2026-07-07.
            (아이존 큰 버튼과 구분되는 작은 텍스트 링크) */}
        {session && isConfigured && (
          <>
            <Link
              to="/parent/reports"
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-black text-ink-600 hover:bg-white/60 hover:text-ink-900 transition-all"
            >
              <span aria-hidden>📊</span>
              <span>{t('sidebar.reports')}</span>
            </Link>
            <Link
              to="/invite-friends"
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-black text-ink-600 hover:bg-white/60 hover:text-ink-900 transition-all"
            >
              <span aria-hidden>🎁</span>
              <span>{t('sidebar.inviteFriends')}</span>
            </Link>
            <Link
              to="/parent/settings"
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-black text-ink-600 hover:bg-white/60 hover:text-ink-900 transition-all"
            >
              <span aria-hidden>⚙️</span>
              <span>{t('sidebar.parentSettings')}</span>
            </Link>
          </>
        )}
        {/* 로그인/로그아웃 — session 상태에 따라 분기 */}
        {session ? (
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-black text-ink-600 hover:bg-white/60 hover:text-danger transition-all"
            aria-label={t('sidebar.logout')}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>{t('sidebar.logout')}</span>
            {activeProfile && (
              <span className="ml-auto text-[11px] text-ink-400 truncate max-w-[60px]">
                {activeProfile.name}
              </span>
            )}
          </button>
        ) : isConfigured ? (
          <Link
            to="/login"
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-black bg-coral-500 hover:bg-coral-600 text-white shadow-soft hover:shadow-pop transition-all"
          >
            <span>🔑</span>
            <span>{t('sidebar.login')}</span>
          </Link>
        ) : null}
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-cream-50">
      {/* 데스크탑 좌측 nav — 태블릿 기준 w-44 (176px). 모바일 hide. */}
      <aside className="hidden md:flex w-44 flex-shrink-0 sticky top-0 h-screen flex-col bg-cream-50 border-r border-ink-100/60">
        {sidebarContent}
      </aside>

      {/* 모바일 슬라이드 드로어 + 오버레이 */}
      {drawerOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-ink-900/40 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
            aria-hidden
          />
          <aside
            className="md:hidden fixed top-0 left-0 z-50 w-44 h-screen flex flex-col bg-cream-50 border-r border-ink-100/60 shadow-2xl"
            style={{ animation: 'slide-in 180ms ease-out' }}
          >
            <button
              onClick={() => setDrawerOpen(false)}
              className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/80 shadow-soft text-ink-700 flex items-center justify-center"
              aria-label={t('header.closeMenu')}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            {sidebarContent}
          </aside>
        </>
      )}

      {/* 우측 영역. /library 일 때 header absolute overlay → main 이 0부터 시작 → 배너가 viewport top 까지. */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <header
          className={cn(
            'h-16 md:h-20 z-30 flex items-center',
            isLibraryRoot
              ? 'absolute top-0 inset-x-0 bg-transparent border-b-0 pointer-events-none'
              : 'sticky top-0 bg-cream-50 border-b border-ink-100/60'
          )}
        >
          {/* isLibraryRoot 면 배너와 동일한 max-w wrapper 안 양쪽 정렬 — 로그인 chip 이 배너 우상단 corner 와 정렬. 그 외 페이지는 풀폭 padding. */}
          <div
            className={cn(
              'w-full h-full flex items-center justify-between',
              isLibraryRoot ? 'max-w-[1600px] mx-auto px-3 sm:px-6 md:px-8' : 'px-3 sm:px-7'
            )}
          >
            {/* 왼쪽: 모바일 햄버거 + 페이지 타이틀 */}
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <button
                onClick={() => setDrawerOpen(true)}
                className="md:hidden w-10 h-10 rounded-full bg-white/90 shadow-soft text-ink-700 flex items-center justify-center flex-shrink-0 pointer-events-auto"
                aria-label={t('header.openMenu')}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
              {/* 모바일 로고 — 사이드바 hidden 일 때 헤더에 노출. /library overlay 헤더에서도 보임. */}
              <Link
                to="/library"
                aria-label={t('logo.home')}
                className="md:hidden pointer-events-auto flex items-center"
              >
                <img
                  src="/logo/logo-kr.webp"
                  alt={t('logo.alt')}
                  className="h-9 w-auto object-contain"
                />
              </Link>
              {pageTitle && (
                <h1 className="hidden sm:flex text-xl md:text-3xl font-black font-display text-ink-900 truncate items-center gap-2">
                  {pageTitle.iconSrc ? (
                    <AppIcon
                      src={pageTitle.iconSrc}
                      size={28}
                      alt={t(pageTitle.titleKey)}
                      className="md:[width:36px] md:[height:36px]"
                    />
                  ) : pageTitle.emoji ? (
                    <span>{pageTitle.emoji}</span>
                  ) : null}
                  <span>{t(pageTitle.titleKey)}</span>
                </h1>
              )}
            </div>

            {/* 우측 — UI 언어 선택 + (아이 2명 이상일 때) 현재 아이 칩. */}
            <div className="flex-shrink-0 pointer-events-auto flex items-center gap-2">
              <UiLangMenu />
              {session && activeProfile && profiles.length > 1 && (
                <button
                  onClick={() => setActiveProfile(null)}
                  className="flex items-center gap-1.5 rounded-full bg-white/90 pl-1 pr-3 py-1 shadow-soft hover:shadow-pop transition-all"
                  aria-label={t('header.switchChild', { name: activeProfile.name })}
                >
                  <AvatarRender id={activeProfile.avatarId} size="sm" />
                  <span className="text-sm font-black text-ink-800 max-w-[80px] truncate">
                    {activeProfile.name}
                  </span>
                  <span className="text-xs font-bold text-ink-400">{t('header.switch')}</span>
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* 메인(브라우즈) 화면 배경음악 — AppShell 이탈(뷰어/게임) 시 자동 정지 */}
      <AppBgm />

      {/* 아이 2명 이상 + 미선택 → 진입 게이트 "누가 놀고 있어요?" (헤더 칩으로 언제든 재호출). */}
      {needsProfilePick && (
        <ProfilePicker
          profiles={profiles}
          onSelect={(p) => setActiveProfile(p)}
          onAddNew={() => navigate('/parent/profiles')}
        />
      )}
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
  const { t } = useTranslation('shell');
  if (comingSoon) {
    // 차분한 disabled 톤 — 카드 음영 + sub-label "준비 중" (배지 대신)
    return (
      <div
        role="button"
        aria-disabled="true"
        title={t('sidebar.comingSoonTitle')}
        className="w-28 h-28 rounded-3xl flex flex-col items-center justify-center gap-1 bg-ink-100/40 cursor-not-allowed select-none"
      >
        <AppIcon src={iconSrc} size={44} alt={label} className="opacity-35" />
        <span className="text-lg font-black text-ink-500">{label}</span>
        <span className="text-xs font-black text-ink-400 tracking-wide">
          {t('sidebar.comingSoon')}
        </span>
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
      <span className="text-lg">{label}</span>
    </NavLink>
  );
}
