import { useEffect, useState } from 'react';
import { Mascot } from '@/components/Mascot';
import { PinPad } from './PinPad';
import { useParentGate } from '../hooks/useParentGate';
import { authApi } from '../api/auth.api';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ParentGateModal({ open, onClose, onSuccess }: Props) {
  const gate = useParentGate();
  const [error, setError] = useState(false);
  const [remainingSec, setRemainingSec] = useState(0);

  useEffect(() => {
    if (!gate.isLockedOut) {
      setRemainingSec(0);
      return;
    }
    const tick = () => {
      setRemainingSec((s) => Math.max(0, s > 0 ? s - 1 : 60));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [gate.isLockedOut]);

  if (!open) return null;

  const handleComplete = async (pin: string) => {
    if (gate.isLockedOut) return;
    try {
      const ok = await authApi.verifyPin(pin);
      if (ok) {
        gate.unlock();
        onSuccess();
        return;
      }
    } catch {
      // network error — treat as wrong PIN
    }
    gate.registerFailure();
    setError(true);
    setTimeout(() => setError(false), 500);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-pop flex flex-col items-center gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <Mascot state="thinking" size="md" character="hori" />
        <h2 className="text-xl font-black text-ink-900">부모님만 들어올 수 있어요</h2>
        {gate.isLockedOut ? (
          <p className="text-danger font-bold text-center">
            잠깐만 쉬었다 다시 해주세요
            <br />({remainingSec}초 남음)
          </p>
        ) : (
          <PinPad onComplete={handleComplete} error={error} disabled={gate.isLockedOut} />
        )}
        <button onClick={onClose} className="text-ink-500 text-sm font-bold mt-2">
          닫기
        </button>
      </div>
    </div>
  );
}
