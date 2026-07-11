import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PinPad } from '../components/PinPad';
import { authApi } from '../api/auth.api';
import { useParentGate } from '../hooks/useParentGate';

type Phase = 'verifyCurrent' | 'newFirst' | 'newConfirm';

const LABEL_KEY: Record<Phase, string> = {
  verifyCurrent: 'pin.change.verifyCurrent',
  newFirst: 'pin.change.newFirst',
  newConfirm: 'pin.change.newConfirm',
};

export function ChangePinStep() {
  const { t } = useTranslation('auth');
  const gate = useParentGate();
  const [phase, setPhase] = useState<Phase>('verifyCurrent');
  const [firstNew, setFirstNew] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const flashError = (reset?: () => void) => {
    setError(true);
    setTimeout(() => {
      setError(false);
      reset?.();
    }, 500);
  };

  const handleVerify = async (pin: string) => {
    try {
      const ok = await authApi.verifyPin(pin);
      if (ok) {
        setPhase('newFirst');
        return;
      }
    } catch {
      // network error — treat as wrong
    }
    gate.registerFailure();
    flashError();
  };

  const handleFirstNew = (pin: string) => {
    setFirstNew(pin);
    setPhase('newConfirm');
  };

  const handleConfirmNew = async (pin: string) => {
    if (pin !== firstNew) {
      flashError(() => {
        setFirstNew(null);
        setPhase('newFirst');
      });
      return;
    }
    try {
      await authApi.setPin(pin);
      alert(t('pin.change.changed'));
      setPhase('verifyCurrent');
      setFirstNew(null);
    } catch {
      flashError();
    }
  };

  const onComplete =
    phase === 'verifyCurrent'
      ? handleVerify
      : phase === 'newFirst'
        ? handleFirstNew
        : handleConfirmNew;

  return (
    <div className="flex flex-col items-center gap-4">
      <h4 className="text-lg font-black text-ink-900">{t(LABEL_KEY[phase])}</h4>
      {gate.isLockedOut ? (
        <p className="text-danger font-bold">{t('pin.change.lockout')}</p>
      ) : (
        <PinPad onComplete={onComplete} error={error} disabled={gate.isLockedOut} />
      )}
    </div>
  );
}
