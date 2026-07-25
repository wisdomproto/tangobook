import { useEffect, useState } from 'react';
import { Outlet, NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { AppIcon } from '@/design-system';
import { useAuth } from '@/features/auth/context/AuthContext';
import { ProfilePicker } from '@/features/auth/components/ProfilePicker';
import { EntryGate } from '@/features/access/components/EntryGate';
import { useGuestMode } from '@/features/access/hooks/useGuestMode';
import { AppBgm } from './AppBgm';
import { UiLangMenu } from './UiLangMenu';
import { InstallPwaButton } from './InstallPwaButton';
import { ProfileChip } from '@/features/auth/components/ProfileChip';
import { cn } from '@/lib/cn';
import { isDevEmail } from '@/config/dev';
import { FeedbackDialog } from '@/features/feedback';

/**
 * 학습자 화면 공통 frame — 좌측 nav (3축 + More Fun) + 상단 헤더 (페이지 타이틀 + 별).
 * 진입점 페이지에만 적용 (deep view 인 viewer/editor/게임 플레이어는 제외).
 *
 * 디자인 타겟: 태블릿 1024-1366 + 4-5세 사용자 → 큰 글자, 큰 터치 타겟, 빈 공간 최소화.
 * 모바일 (<md / <768px): 사이드바 hide → 헤더 좌상단 햄버거 → 슬라이드 드로어. 320px 부터 지원.
 */
/**
 * 사이드바 메인 axis — 모두 동일 정사각 박스 디자인 (정렬 통일).
 * 일반 노출 = 동화책(어디서든 alwaysActive) · 어휘 게임 · 파닉스.
 * 어휘/학습게임은 devOnly (코드·라우트는 보존, DEV_EMAILS 에게만 노출).
 */
const PRIMARY_AXES = [
  {
    to: '/library',
    iconSrc: 'tab/storybook.svg',
    labelKey: 'sidebar.storybooks',
    color: 'coral' as const,
    end: true,
    comingSoon: false,
    // 파닉스 사이드바 부활(2026-07-23) 후 alwaysActive 는 이중 활성 버그 — 라우트 기반으로만.
    alwaysActive: false,
    devOnly: false,
    authOnly: false,
  },
  // 연속재생의 1차 진입점은 사이드바가 아니라 메인화면(라이브러리 「묶어 보기」) —
  // PlaylistLibrarySection 이 카테고리 묶음을 게스트·로그인 동일하게 항상 표시. 2026-07-07 → 07-24 개편.
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
    // 파닉스 — 한글 32 + 영어 39 유닛 전부 공개 상태라 일반 노출로 복귀(2026-07-23).
    // 랜딩(/library/phonics)에서 한글/영어를 고른다.
    to: '/library/phonics',
    iconSrc: 'tab/phonics.svg',
    labelKey: 'sidebar.phonics',
    color: 'mint' as const,
    end: false,
    comingSoon: false,
    alwaysActive: false,
    devOnly: false,
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
  // 어휘 게임 — 사이드바 라벨 재사용(전용 키를 5개 로케일에 새로 넣을 이유 없음).
  if (pathname.startsWith('/games/vocab'))
    return { iconSrc: 'game/korean-block.webp', titleKey: 'sidebar.vocabGames' };
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
  const guest = useGuestMode();
  const needsProfilePick = !!session && profiles.length > 1 && !activeProfile;
  const pageTitle = getPageTitle(location.pathname);
  // /library 는 배너가 viewport top 까지 차지 — 헤더 absolute overlay (transparent) 로
  // main 이 0부터 시작. 우상단 chip 만 pointer-events-auto 로 클릭 가능.
  const isLibraryRoot = location.pathname === '/library';
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  // 헤더 프로필 칩 → 프로필 시트(선택/전환/관리) 수동 오픈.
  const [pickerOpen, setPickerOpen] = useState(false);
  // 하단 부모 메뉴(리포팅·초대·설정·건의) 접기/펴기 — 기본 접힘(사이드바 정리).
  const [parentMenuOpen, setParentMenuOpen] = useState(false);

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
      <div className="h-20 shrink-0 flex items-center justify-center px-2 border-b border-ink-100/40">
        <Link to="/library" aria-label={t('logo.home')}>
          <img
            src={i18n.language === 'ko' ? '/logo/logo-kr.webp' : '/logo/logo-en.webp'}
            alt={t('logo.alt')}
            className="h-14 w-auto object-contain"
          />
        </Link>
      </div>

      {/* 현재 아이 프로필 칩 — 아이 1명이어도 상시. 탭 → 프로필 시트(전환/추가·관리).
          모바일은 사이드바가 숨겨지므로 헤더 우상단에도 같은 칩을 둔다. */}
      {session && activeProfile && (
        <div className="flex justify-center px-2 pt-3 shrink-0">
          <ProfileChip profile={activeProfile} onClick={() => setPickerOpen(true)} />
        </div>
      )}

      {/* 로고 바로 아래 — UI 언어 선택. 「홈에 설치」는 헤더 우상단(로그인/로그아웃 옆)으로 통합
          (2026-07-25) — 사이드바·배너에 각각 있어 한 화면에 설치 버튼이 두 개였다. */}
      <div className="flex flex-col items-center gap-2 px-2 py-3 border-b border-ink-100/40 shrink-0">
        <UiLangMenu />
      </div>

      {/* 아이 zone — 동화책(아이가 매일 만지는 유일한 것) + 파닉스 / 어휘 / 학습 게임 (개발자 전용).
          부모 작업(리포팅·초대·연속재생·설정)은 위계를 정직하게 하려고 하단 부모 영역으로 분리. 2026-07-07. */}
      <nav className="flex-1 min-h-0 overflow-y-auto w-full flex flex-col gap-2.5 items-center pt-5 pb-5">
        {PRIMARY_AXES.filter(
          (a) => (!a.devOnly || isDevEmail(account?.email)) && (!a.authOnly || !!session)
        ).map((axis) => (
          <PrimaryNavButton key={axis.to} {...axis} label={t(axis.labelKey)} />
        ))}
      </nav>

      {/* 부모 영역 — 부모 메뉴만. 하단 고정(nav flex-1 이 위 공간을 채워 밀어냄).
          로그아웃/로그인이 헤더로 빠져서(2026-07-25) 비로그인 땐 내용이 없다 → 블록째 숨긴다
          (안 그러면 빈 구분선 바만 남는다). */}
      {session && isConfigured && (
        <div className="shrink-0 px-3 pt-3 pb-3 border-t-2 border-ink-200/60 bg-cream-100/30 flex flex-col gap-1.5">
          {/* 부모 도메인 작업 — 학습 리포팅 · 친구 초대 · 부모 설정 · 건의하기.
              사이드바 정리를 위해 접이식(기본 접힘). 2026-07-14. */}
          <>
            <button
              type="button"
              onClick={() => setParentMenuOpen((o) => !o)}
              aria-expanded={parentMenuOpen}
              className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm font-black text-ink-600 hover:bg-white/60 hover:text-ink-900 transition-all"
            >
              <span className="flex items-center gap-2">
                <span aria-hidden>👨‍👩‍👧</span>
                <span>{t('sidebar.parentMenu')}</span>
              </span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={cn(
                  'text-ink-400 shrink-0 transition-transform',
                  parentMenuOpen && 'rotate-180'
                )}
                aria-hidden
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {parentMenuOpen && (
              <div className="flex flex-col gap-1.5">
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
                <button
                  type="button"
                  onClick={() => setFeedbackOpen(true)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-black text-ink-600 hover:bg-white/60 hover:text-ink-900 transition-all"
                >
                  <span aria-hidden>💬</span>
                  <span>{t('sidebar.feedback')}</span>
                </button>
                {/* 로그아웃 — 헤더 자리를 프로필 칩에 내주고 부모 메뉴로 복귀(2026-07-25).
                    부모 작업이라 여기가 제자리다. */}
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-black text-ink-600 hover:bg-white/60 hover:text-danger transition-all"
                >
                  <span aria-hidden>🚪</span>
                  <span>{t('sidebar.logout')}</span>
                </button>
              </div>
            )}
          </>
        </div>
      )}
    </>
  );

  return (
    <div className="flex min-h-screen bg-cream-50">
      {/* 데스크탑 좌측 nav — 태블릿 기준 w-44 (176px). 모바일 hide. */}
      <aside className="hidden md:flex w-44 flex-shrink-0 sticky top-0 h-[100dvh] flex-col bg-cream-50 border-r border-ink-100/60">
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
            className="md:hidden fixed top-0 left-0 z-50 w-44 h-[100dvh] flex flex-col bg-cream-50 border-r border-ink-100/60 shadow-2xl"
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

      {/* 우측 영역.
          🔴 /library 헤더는 예전에 **배너 위 투명 absolute 오버레이**였다(배너가 viewport top 까지 닿게).
          헤더가 비어 있을 땐 괜찮았지만, 「홈에 설치」·로그인/로그아웃이 들어오면서 버튼이 배너
          일러스트를 깔고 앉아 붙어 보였다 → 오버레이를 걷고 **제 높이를 차지하는 sticky 헤더**로
          통일(2026-07-25). 배경은 페이지 그라데이션 상단과 같은 cream-50 이라 이음매가 안 보이고,
          배너는 헤더 아래에서 시작한다. 좌우 정렬만 배너와 같은 max-w wrapper 로 맞춘다. */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <header
          className={cn(
            'h-16 md:h-20 z-30 flex items-center sticky top-0 bg-cream-50',
            !isLibraryRoot && 'border-b border-ink-100/60',
            // 라이브러리 루트 데스크탑: 헤더에 남는 게 없어(버튼은 배너로, 로고는 사이드바) 빈 바가
            // 되므로 접는다. 모바일은 햄버거+로고가 필요해 유지.
            isLibraryRoot && 'md:hidden'
          )}
        >
          {/* isLibraryRoot 면 배너와 동일한 max-w wrapper 안 양쪽 정렬 — 버튼이 배너 우측 끝과 정렬. 그 외 페이지는 풀폭 padding. */}
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
              {/* 모바일 로고 — 사이드바 hidden 일 때 헤더에 노출. */}
              <Link
                to="/library"
                aria-label={t('logo.home')}
                className="md:hidden pointer-events-auto flex items-center"
              >
                <img
                  src={i18n.language === 'ko' ? '/logo/logo-kr.webp' : '/logo/logo-en.webp'}
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

            {/* 우측 — 홈에 설치 + 아이 프로필 칩(로그인) / 로그인 버튼.
                🔴 로그아웃은 여기가 아니라 사이드바 부모 메뉴에 있다(부모 작업).
                🔴 라이브러리 루트 데스크탑에선 헤더 자체가 접히고 사이드바·배너가 대신한다 →
                md+ 에서만 숨겨 모바일 헤더의 빈 우측 공간을 쓴다. */}
            <div
              className={cn('flex-shrink-0 flex items-center gap-2', isLibraryRoot && 'md:hidden')}
            >
              <InstallPwaButton className="flex items-center gap-1.5 rounded-full bg-coral-500 px-3 py-2 text-sm font-black text-white shadow-soft transition hover:brightness-110 hover:shadow-pop sm:px-4" />
              {session && activeProfile ? (
                <ProfileChip profile={activeProfile} onClick={() => setPickerOpen(true)} />
              ) : session ? null : isConfigured ? (
                <Link
                  to="/login"
                  className="flex items-center gap-2 rounded-full bg-coral-500 px-4 py-2 shadow-soft text-sm font-black text-white hover:bg-coral-600 hover:shadow-pop transition-all"
                >
                  <span aria-hidden>🔑</span>
                  <span>{t('sidebar.login')}</span>
                </Link>
              ) : null}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* 건의하기 모달 — 부모 영역 "건의하기" 버튼에서 호출 */}
      <FeedbackDialog open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />

      {/* 메인(브라우즈) 화면 배경음악 — AppShell 이탈(뷰어/게임) 시 자동 정지 */}
      <AppBgm />

      {/* 진입 게이트 — 미로그인 방문자의 첫 선택(게스트 30일 / 가입 / 로그인).
          게스트 30일이 끝나면 같은 게이트가 가입 벽으로 재등장한다. 로그인 사용자는 안 뜬다.
          Supabase 미설정(게스트 전용 빌드)에서는 가입 경로가 없으므로 게이트도 띄우지 않는다. */}
      {!session && isConfigured && guest.needsGate && (
        <EntryGate expired={guest.expired} onChoose={guest.refresh} />
      )}

      {/* 프로필 시트 "누가 놀고 있어요?" — ①아이 2명+ 미선택 시 필수 진입 게이트(닫기 없음)
          ②헤더 프로필 칩 탭 시 수동 오픈(전환/추가·관리, activeProfile 있으면 ✕ 닫기). */}
      {(needsProfilePick || pickerOpen) && (
        <ProfilePicker
          profiles={profiles}
          onSelect={(p) => {
            setActiveProfile(p);
            setPickerOpen(false);
          }}
          onAddNew={() => {
            setPickerOpen(false);
            navigate('/parent/profiles');
          }}
          onClose={activeProfile ? () => setPickerOpen(false) : undefined}
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
        <span className="text-sm leading-tight text-center break-keep font-black text-ink-500">
          {label}
        </span>
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
      <span className="text-sm leading-tight text-center break-keep">{label}</span>
    </NavLink>
  );
}
