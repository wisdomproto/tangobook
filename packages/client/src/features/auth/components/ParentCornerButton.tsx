import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useParentGate } from '../hooks/useParentGate';
import { ParentGateModal } from './ParentGateModal';

export function ParentCornerButton() {
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
    if (gate.isUnlocked) {
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
        {session ? '👤 부모님 영역' : '🔒 부모'}
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
