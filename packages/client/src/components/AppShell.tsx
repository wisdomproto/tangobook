import { useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Mascot, AppIcon } from '@/design-system';
import { StarCounter } from '@/features/rewards';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useBookIndex } from '@/features/book-v2';
import { cn } from '@/lib/cn';

/**
 * 학습자 화면 공통 frame — 좌측 nav (3축 + More Fun) + 상단 헤더 (페이지 타이틀 + 별).
 * 진입점 페이지에만 적용 (deep view 인 viewer/editor/게임 플레이어는 제외).
 *
 * 디자인 타겟: 태블릿 1024-1366 + 4-5세 사용자 → 큰 글자, 큰 터치 타겟, 빈 공간 최소화.
 */
const PRIMARY_AXES = [
  {
    to: '/library',
    iconSrc: 'tab/storybook.svg',
    label: '동화책',
    color: 'coral' as const,
    end: true,
  },
  {
    to: '/library/phonics',
    iconSrc: 'tab/phonics.svg',
    label: '파닉스',
    color: 'mint' as const,
    end: false,
  },
  {
    to: '/vocabulary',
    iconSrc: 'tab/vocab.svg',
    label: '어휘',
    color: 'amber' as const,
    end: false,
  },
];

const MORE_FUN = [{ to: '/collection', iconSrc: 'section/collection.png', label: '도감' }];

/**
 * 페이지 path → 큰 타이틀 (SVG 아이콘 path + 텍스트) 매핑.
 * 이모지 대신 디자인 시스템 SVG 사용 — 가독성 + 톤 일관성.
 * 매칭되는 SVG 가 없으면 emoji 폴백.
 */
function getPageTitle(
  pathname: string
): { iconSrc?: string; emoji?: string; title: string } | null {
  if (pathname === '/library') return { iconSrc: 'tab/storybook.svg', title: '동화책' };
  if (pathname.startsWith('/library/phonics'))
    return { iconSrc: 'tab/phonics.svg', title: '파닉스' };
  if (pathname.startsWith('/vocabulary/book-'))
    return { iconSrc: 'tab/vocab.svg', title: '단어 익히기' };
  if (pathname.startsWith('/vocabulary')) return { iconSrc: 'tab/vocab.svg', title: '어휘 마스터' };
  if (pathname.startsWith('/collection'))
    return { iconSrc: 'section/collection.png', title: '도감' };
  if (pathname.startsWith('/parent')) return { emoji: '👨‍👩‍👧', title: '부모님 모드' };
  return null;
}

export function AppShell() {
  const { activeProfile, session, signOut, isConfigured } = useAuth();
  const { data: index } = useBookIndex();
  const location = useLocation();
  const bookCount = index?.books?.filter((b) => b.isPublic).length ?? 0;
  const pageTitle = getPageTitle(location.pathname);

  // 학습자 화면은 라이트 모드 고정
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  const handleSignOut = async () => {
    if (!window.confirm('로그아웃할까요?')) return;
    await signOut();
  };

  // 인사말 — /library 계열에서만 권수 강조, 그 외는 fallback
  const greeting =
    location.pathname.startsWith('/library') && bookCount > 0
      ? `${bookCount}권이 너를 기다려 👋`
      : '';

  return (
    <div className="flex min-h-screen bg-cream-50">
      {/* 좌측 nav — 태블릿 기준 w-44 (176px). 박스 + 라벨 가독성 우선. */}
      <aside className="w-44 flex-shrink-0 sticky top-0 h-screen flex flex-col bg-cream-50 border-r border-ink-100/60">
        {/* 로고 영역 */}
        <div className="h-20 flex items-center px-4 gap-2 border-b border-ink-100/40">
          <Mascot character="hori" state="waving" size="md" />
          <span className="text-lg font-black text-ink-900 font-display">탱고북</span>
        </div>

        {/* 3축 메인 — 박스 100×100, 라벨 sm */}
        <nav className="flex flex-col gap-3 items-center pt-5">
          {PRIMARY_AXES.map((axis) => (
            <PrimaryNavButton key={axis.to} {...axis} />
          ))}
        </nav>

        <div className="mt-6 mx-3 border-t border-ink-100/60" />

        <nav className="flex flex-col gap-1 px-3 pt-4">
          {MORE_FUN.map((item) => (
            <SecondaryNavButton key={item.to} {...item} />
          ))}
        </nav>

        {/* 휑함 채우는 호리 마스코트 — 빈 공간 장식 + 친근감 */}
        <div className="mt-auto flex flex-col items-center pb-2">
          <Mascot character="hori" state="cheering" size="lg" />
          <div className="mt-1 px-3 py-1.5 rounded-2xl bg-coral-100 text-coral-700 text-sm font-black text-center shadow-soft">
            오늘도 화이팅! ✨
          </div>
        </div>

        <div className="px-3 pb-3 pt-3 border-t border-ink-100/60">
          {isConfigured && <SecondaryNavButton to="/parent" emoji="🔒" label="부모" />}
        </div>
      </aside>

      {/* 우측 영역 */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 sticky top-0 z-30 px-7 flex items-center justify-between bg-cream-50 border-b border-ink-100/60">
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

          {/* 오른쪽: 별 + 프로필 + 로그아웃 */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {activeProfile && <StarCounter />}
            {activeProfile && (
              <div className="px-4 py-2 rounded-full bg-white shadow-soft text-sm font-black text-ink-900">
                👦 {activeProfile.name}
              </div>
            )}
            {session && (
              <button
                onClick={handleSignOut}
                className="text-2xl text-ink-500 hover:text-danger transition px-2"
                title="로그아웃"
              >
                🚪
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

const COLOR_ACTIVE: Record<'coral' | 'mint' | 'amber', string> = {
  coral: 'bg-coral-500 text-white shadow-pop ring-4 ring-coral-200',
  mint: 'bg-success text-white shadow-pop ring-4 ring-success/30',
  amber: 'bg-warn text-ink-900 shadow-pop ring-4 ring-warn/40',
};

const COLOR_IDLE: Record<'coral' | 'mint' | 'amber', string> = {
  coral: 'bg-coral-100 text-coral-600 hover:bg-coral-200',
  mint: 'bg-success/15 text-success hover:bg-success/25',
  amber: 'bg-warn/20 text-ink-900 hover:bg-warn/30',
};

function PrimaryNavButton({
  to,
  iconSrc,
  label,
  color,
  end,
}: {
  to: string;
  iconSrc: string;
  label: string;
  color: 'coral' | 'mint' | 'amber';
  end: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'w-28 h-28 rounded-3xl flex flex-col items-center justify-center gap-1.5 transition-all font-black',
          isActive ? COLOR_ACTIVE[color] : COLOR_IDLE[color],
          !isActive && 'hover:scale-105'
        )
      }
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
