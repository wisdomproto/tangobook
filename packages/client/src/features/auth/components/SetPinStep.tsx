import { useState } from 'react';
import { Mascot } from '@/components/Mascot';
import { PinPad } from './PinPad';
import { authApi } from '../api/auth.api';
import { useAuth } from '../context/AuthContext';

interface Props {
  onComplete?: () => void | Promise<void>;
}

export function SetPinStep({ onComplete }: Props = {}) {
  const { refresh } = useAuth();
  const [phase, setPhase] = useState<'first' | 'confirm'>('first');
  const [firstPin, setFirstPin] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const resetToFirst = () => {
    setError(true);
    setTimeout(() => {
      setError(false);
      setFirstPin(null);
      setPhase('first');
    }, 500);
  };

  const handleFirst = (pin: string) => {
    setFirstPin(pin);
    setPhase('confirm');
  };

  const handleConfirm = async (pin: string) => {
    if (pin !== firstPin) {
      resetToFirst();
      return;
    }
    try {
      await authApi.setPin(pin);
      await refresh();
      if (onComplete) await onComplete();
    } catch {
      resetToFirst();
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 max-w-sm">
      <Mascot state="thinking" size="md" character="hori" />
      <h2 className="text-2xl font-black text-ink-900">
        {phase === 'first' ? 'PIN 만들기' : 'PIN 다시 입력해주세요'}
      </h2>
      <p className="text-ink-500 text-center">부모님만 볼 영역을 보호해요 🔒</p>
      <PinPad onComplete={phase === 'first' ? handleFirst : handleConfirm} error={error} />
    </div>
  );
}
