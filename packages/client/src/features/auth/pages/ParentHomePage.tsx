import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

export default function ParentHomePage() {
  const { t } = useTranslation('auth');
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    // AppShell 사이드바 로그아웃과 동일한 보호 — 실수/아이 터치로 즉시 로그아웃 방지.
    if (!window.confirm(t('parentHome.signOutConfirm'))) return;
    await signOut();
    navigate('/library');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 to-peach-100 p-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
          <div className="flex gap-2 overflow-x-auto items-center">
            <button
              onClick={() => navigate('/library')}
              className="px-4 py-2 rounded-full font-bold whitespace-nowrap bg-white text-ink-900 shadow-soft hover:bg-peach-100 transition"
              title={t('parentHome.backToLibrary')}
            >
              {t('parentHome.back')}
            </button>
            <NavLink to="/parent/reports" className={({ isActive }) => tabClass(isActive)}>
              {t('parentHome.tabReports')}
            </NavLink>
            <NavLink to="/parent/profiles" className={({ isActive }) => tabClass(isActive)}>
              {t('parentHome.tabProfiles')}
            </NavLink>
            <NavLink to="/parent/settings" className={({ isActive }) => tabClass(isActive)}>
              {t('parentHome.tabSettings')}
            </NavLink>
          </div>
          <button
            onClick={handleSignOut}
            className="text-2xl hover:opacity-70"
            aria-label={t('parentHome.signOut')}
          >
            🚪
          </button>
        </div>
        <Outlet />
      </div>
    </div>
  );
}

function tabClass(isActive: boolean) {
  return `px-4 py-2 rounded-full font-bold whitespace-nowrap ${
    isActive ? 'bg-coral-500 text-white' : 'bg-white text-ink-900 shadow-soft'
  }`;
}
