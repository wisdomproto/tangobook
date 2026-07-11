import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useParentGate } from '../hooks/useParentGate';
import { ParentGateModal } from './ParentGateModal';
import { PIN_REQUIRED } from '@/config/features';

export function ParentCornerButton() {
  const { t } = useTranslation('auth');
  const { isConfigured, session } = useAuth();
  const gate = useParentGate();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (!isConfigured) return null;

  const handleClick = () => {
    if (!session) {
      navigate('/login');
      return;
    }
    // PIN_REQUIRED=false면 PIN 모달 skip — 바로 부모 영역 진입
    if (!PIN_REQUIRED || gate.isUnlocked) {
      navigate('/parent');
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="px-3 py-2 rounded-full bg-white shadow-soft text-ink-900 font-bold text-sm hover:shadow-pop"
      >
        {session ? t('parentCorner.parentArea') : t('parentCorner.parentLocked')}
      </button>
      <ParentGateModal
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={() => {
          setOpen(false);
          navigate('/parent');
        }}
      />
    </>
  );
}
