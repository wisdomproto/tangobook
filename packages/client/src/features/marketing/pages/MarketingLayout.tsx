import { useAuth } from '@/features/auth/context/AuthContext';
import { MarketingShell } from '../components/layout/MarketingShell';
import { MarketingGate } from '../components/auth/MarketingGate';

/**
 * Auth guard + shell wrapper for the /marketing/* route tree.
 *
 * - Loading: show a centered spinner (auth state unknown).
 * - No session: show the password gate (8054 → 소유자 세션 자동 발급).
 * - Session: render MarketingShell which provides Sidebar + TopBar + <Outlet/>.
 *
 * This component is the `element` of the `marketing` route in router/index.tsx.
 * Child routes are rendered inside MarketingShell's <Outlet/>.
 */
export function MarketingLayout() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <span
          className="inline-block w-8 h-8 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin"
          aria-label="로딩 중"
          role="status"
        />
      </div>
    );
  }

  if (!session) {
    return <MarketingGate />;
  }

  return <MarketingShell />;
}
