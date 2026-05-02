import { useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Mascot, AppIcon } from '@/design-system';
import { StarCounter } from '@/features/rewards';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useBookIndex } from '@/features/book-v2';
import { cn } from '@/lib/cn';

/**
 * 학습자 화면 공통 frame — 좌측 슬림 nav (3축 + More Fun) + 상단 헤더 (인사 + 별).
 * 진입점 페이지에만 적용 (deep view 인 viewer/editor/게임 플레이어는 제외).
 * 학습자 영역은 라이트 모드 고정 (어두운 화면 안 씀).
 */
/** AppIcon 자산 경로 (public/icons/...) 또는 외부 경로 */
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

const MORE_FUN = [
  { to: '/collection', iconSrc: 'section/collection.png', label: '카드' },
  { to: '/hori-room', iconSrc: 'mascot/hori/idle.webp', label: '호리 방' },
  // 호리 게임 — 전용 아이콘 미제작. 임시로 콜렉션 카드 일러스트 같은 톤 (조이스틱 자산 예정)
  { to: '/games', iconSrc: '', emoji: '🎮', label: '호리 게임' },
  { to: '/playground', iconSrc: 'section/playground.png', label: '단어 놀이' },
];

export function AppShell() {
  const { activeProfile, session, signOut } = useAuth();
  const { data: index } = useBookIndex();
  const bookCount = index?.books?.filter((b) => b.isPublic).length ?? 0;

  // 학습자 화면은 라이트 모드 고정 — 다른 페이지(editor 등)에서 dark class 잔존해도 강제 해제
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  const handleSignOut = async () => {
    if (!window.confirm('로그아웃할까요?')) return;
    await signOut();
  };

  return (
    <div className="flex min-h-screen bg-cream-50">
      {/* 좌측 nav */}
      <aside className="w-40 flex-shrink-0 sticky top-0 h-screen flex flex-col bg-cream-50 border-r border-ink-100/60">
        {/* 로고 영역 — 헤더 (h-14) 와 정렬 */}
        <div className="h-14 flex items-center px-4 border-b border-ink-100/40">
          <Mascot character="hori" state="waving" size="sm" />
          <span className="ml-2 text-sm font-black text-ink-900">탱고북</span>
        </div>

        {/* 3축 메인 */}
        <nav className="flex flex-col gap-2 items-center pt-4">
          {PRIMARY_AXES.map((axis) => (
            <PrimaryNavButton key={axis.to} {...axis} />
          ))}
        </nav>

        <div className="mt-5 mx-3 border-t border-ink-100/60" />

        <nav className="flex flex-col gap-0.5 px-2 pt-3">
          {MORE_FUN.map((item) => (
            <SecondaryNavButton key={item.to} {...item} />
          ))}
        </nav>

        <div className="mt-auto px-2 pb-3 pt-2 border-t border-ink-100/60">
          <SecondaryNavButton to="/parent" emoji="🔒" label="부모" />
        </div>
      </aside>

      {/* 우측 영역 */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 sticky top-0 z-30 px-6 flex items-center justify-between bg-cream-50 border-b border-ink-100/60">
          {/* 왼쪽: 인사 한 줄 */}
          <div className="text-sm font-bold text-ink-700">
            {bookCount > 0 ? `${bookCount}권이 너를 기다려 👋` : '안녕! 오늘은 뭐 할까?'}
          </div>

          {/* 오른쪽: 별 + 프로필 + 로그아웃 */}
          <div className="flex items-center gap-2">
            {activeProfile && <StarCounter />}
            {activeProfile && (
              <div className="px-3 py-1 rounded-full bg-white/70 text-xs font-bold text-ink-900">
                👦 {activeProfile.name}
              </div>
            )}
            {session && (
              <button
                onClick={handleSignOut}
                className="text-sm text-ink-500 hover:text-danger transition px-2"
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
          'w-24 h-24 rounded-3xl flex flex-col items-center justify-center gap-1 transition-all font-black',
          isActive ? COLOR_ACTIVE[color] : COLOR_IDLE[color],
          !isActive && 'hover:scale-105'
        )
      }
    >
      <AppIcon src={iconSrc} size={42} alt={label} />
      <span className="text-xs">{label}</span>
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
  /** AppIcon 경로 — 없으면 emoji 폴백 */
  iconSrc?: string;
  emoji?: string;
  label: string;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all',
          isActive ? 'bg-white text-ink-900 shadow-soft' : 'text-ink-700 hover:bg-white/60'
        )
      }
    >
      {iconSrc ? (
        <AppIcon src={iconSrc} size={22} alt={label} className="rounded" />
      ) : (
        <span className="text-lg">{emoji}</span>
      )}
      <span>{label}</span>
    </NavLink>
  );
}
