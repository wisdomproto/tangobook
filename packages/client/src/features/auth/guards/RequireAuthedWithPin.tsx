import type { ReactNode } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useParentGate } from '../hooks/useParentGate';
import { SetPinStep } from '../components/SetPinStep';
import { ParentGateModal } from '../components/ParentGateModal';
import { PIN_REQUIRED } from '@/config/features';

export function RequireAuthedWithPin({ children }: { children: ReactNode }) {
  const { isConfigured, session, account, loading, refresh } = useAuth();
  const gate = useParentGate();
  const navigate = useNavigate();

  if (loading) return null;
  if (!isConfigured) return <Navigate to="/library" replace />;
  if (!session) return <Navigate to="/login" replace />;

  // PIN_REQUIRED=false 모드에선 session만 있으면 통과 (테스트/개인 사용)
  if (!PIN_REQUIRED) {
    return <>{children}</>;
  }

  if (!account?.hasPin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50 p-4">
        <SetPinStep
          onComplete={async () => {
            await refresh();
          }}
        />
      </div>
    );
  }
  if (!gate.isUnlocked) {
    return <ParentGateModal open onClose={() => navigate('/library')} onSuccess={() => {}} />;
  }
  return <>{children}</>;
}
