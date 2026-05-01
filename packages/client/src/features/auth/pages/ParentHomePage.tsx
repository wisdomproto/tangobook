import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ParentHomePage() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/library');
  };

  return (
    <div className="min-h-screen bg-cream-50 p-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
          <div className="flex gap-2 overflow-x-auto items-center">
            <button
              onClick={() => navigate('/library')}
              className="px-4 py-2 rounded-full font-bold whitespace-nowrap bg-white text-ink-900 shadow-soft hover:bg-peach-100 transition"
              title="라이브러리로 돌아가기"
            >
              ← 돌아가기
            </button>
            <NavLink to="/parent/reports" className={({ isActive }) => tabClass(isActive)}>
              📊 학습 리포트
            </NavLink>
            <NavLink to="/parent/profiles" className={({ isActive }) => tabClass(isActive)}>
              👦 자녀
            </NavLink>
            <NavLink to="/parent/settings" className={({ isActive }) => tabClass(isActive)}>
              ⚙️ 설정
            </NavLink>
          </div>
          <button
            onClick={handleSignOut}
            className="text-2xl hover:opacity-70"
            aria-label="로그아웃"
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
