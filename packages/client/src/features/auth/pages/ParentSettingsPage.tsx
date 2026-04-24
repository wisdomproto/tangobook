import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/auth.api';
import { ChangePinStep } from './ChangePinStep';
import { PIN_REQUIRED } from '@/config/features';

export default function ParentSettingsPage() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/library');
  };

  const handleDelete = async () => {
    const ok1 = window.confirm('정말 삭제할까요? 모든 자녀 프로필과 학습 기록이 사라져요');
    if (!ok1) return;
    const ok2 = window.confirm('다시 한 번, 삭제하면 되돌릴 수 없어요');
    if (!ok2) return;
    setDeleting(true);
    try {
      await authApi.deleteAccount();
      navigate('/library');
    } catch (err) {
      alert(err instanceof Error ? err.message : '삭제 실패');
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {PIN_REQUIRED && (
        <section className="bg-white rounded-2xl p-6 shadow-soft">
          <h3 className="text-xl font-black text-ink-900 mb-4">🔒 PIN 변경</h3>
          <ChangePinStep />
        </section>
      )}
      <section className="bg-white rounded-2xl p-6 shadow-soft">
        <h3 className="text-xl font-black text-ink-900 mb-4">🚪 로그아웃</h3>
        <button
          onClick={handleSignOut}
          className="px-6 py-3 rounded-xl bg-coral-500 text-white font-bold"
        >
          로그아웃
        </button>
      </section>
      <section className="bg-red-50 rounded-2xl p-6 border-2 border-danger/20">
        <h3 className="text-xl font-black text-danger mb-4">⚠️ 계정 삭제</h3>
        <p className="text-ink-700 text-sm mb-4">모든 자녀 프로필과 학습 기록이 영구히 사라져요.</p>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="px-6 py-3 rounded-xl bg-danger text-white font-bold hover:brightness-110 disabled:opacity-50"
        >
          {deleting ? '삭제 중…' : '계정 삭제하기'}
        </button>
      </section>
    </div>
  );
}
