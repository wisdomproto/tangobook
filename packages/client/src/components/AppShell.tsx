import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Mascot } from '@/design-system';
import { StarCounter } from '@/features/rewards';
import { useAuth } from '@/features/auth/context/AuthContext';
import { ParentCornerButton } from '@/features/auth/components/ParentCornerButton';
import { useBookIndex } from '@/features/book-v2';
import { cn } from '@/lib/cn';

/**
 * 학습자 화면 공통 frame — 좌측 슬림 nav (3축 + More Fun) + 상단 헤더 (인사 + 검색 자리 + 별).
 * 진입점 페이지에만 적용 (deep view 인 viewer/editor/게임 플레이어는 제외).
 */
const PRIMARY_AXES = [
  { to: '/library', icon: '📚', label: '동화책', color: 'coral' as const, end: true },
  { to: '/library/phonics', icon: '🔤', label: '파닉스', color: 'mint' as const, end: false },
  { to: '/vocabulary', icon: '✨', label: '어휘', color: 'amber' as const, end: false },
];

const MORE_FUN = [
  { to: '/collection', icon: '🃏', label: '카드' },
  { to: '/hori-room', icon: '🦊', label: '호리 방' },
  { to: '/games', icon: '🎮', label: '호리 게임' },
  { to: '/playground', icon: '🎪', label: '단어 놀이' },
];

export function AppShell() {
  const { activeProfile, session, signOut } = useAuth();
  const { data: index } = useBookIndex();
  const bookCount = index?.books?.filter((b) => b.isPublic).length ?? 0;
  const location = useLocation();

  const handleSignOut = async () => {
    if (!window.confirm('로그아웃할까요?')) return;
    await signOut();
  };

  return (
    <div className="flex min-h-screen bg-cream-50 dark:bg-darkbg">
      {/* 좌측 nav */}
      <aside className="w-44 flex-shrink-0 sticky top-0 h-screen flex flex-col py-5 px-3 bg-white/60 dark:bg-slate-900/40 backdrop-blur border-r border-ink-100 dark:border-slate-700">
        {/* 3축 메인 */}
        <nav className="flex flex-col gap-3 items-center">
          {PRIMARY_AXES.map((axis) => (
            <PrimaryNavButton key={axis.to} {...axis} />
          ))}
        </nav>

        <div className="my-5 border-t border-ink-100 dark:border-slate-700 mx-2" />

        <div className="text-xs font-black text-ink-500 dark:text-slate-400 mb-2 px-2 uppercase tracking-wide">
          More Fun
        </div>
        <nav className="flex flex-col gap-1">
          {MORE_FUN.map((item) => (
            <SecondaryNavButton key={item.to} {...item} />
          ))}
        </nav>

        <div className="mt-auto pt-3 border-t border-ink-100 dark:border-slate-700">
          <SecondaryNavButton to="/parent" icon="🔒" label="부모" />
        </div>
      </aside>

      {/* 우측 영역 */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 sticky top-0 z-30 px-6 flex items-center justify-between bg-white/70 dark:bg-slate-900/60 backdrop-blur border-b border-ink-100 dark:border-slate-700">
          {/* 왼쪽: 인사 */}
          <div className="flex items-center gap-3">
            <Mascot character="hori" state="waving" size="sm" />
            <div>
              <div className="text-base font-black text-ink-900 dark:text-cream-50">탱고북</div>
              <div className="text-xs font-bold text-ink-500 dark:text-slate-400">
                {bookCount > 0 ? `${bookCount}권이 너를 기다려 👋` : '안녕! 오늘은 뭐 할까?'}
              </div>
            </div>
          </div>

          {/* 오른쪽: 별 + 프로필 + 부모 */}
          <div className="flex items-center gap-2">
            {activeProfile && <StarCounter />}
            {activeProfile && (
              <div className="px-3 py-1.5 rounded-full bg-cream-50 dark:bg-slate-800 text-sm font-bold text-ink-900 dark:text-cream-50 shadow-soft">
                👦 {activeProfile.name}
              </div>
            )}
            <ParentCornerButton />
            {session && (
              <button
                onClick={handleSignOut}
                className="px-3 py-2 rounded-full bg-white dark:bg-slate-800 shadow-soft text-ink-700 dark:text-cream-50 text-sm hover:shadow-pop hover:text-danger transition"
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
  icon,
  label,
  color,
  end,
}: {
  to: string;
  icon: string;
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
      <span className="text-3xl">{icon}</span>
      <span className="text-xs">{label}</span>
    </NavLink>
  );
}

function SecondaryNavButton({ to, icon, label }: { to: string; icon: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all',
          isActive
            ? 'bg-white dark:bg-slate-800 text-ink-900 dark:text-cream-50 shadow-soft'
            : 'text-ink-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/40'
        )
      }
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}
