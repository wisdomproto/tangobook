import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SignInForm } from './SignInForm';
import { SignUpForm } from './SignUpForm';
import { SetPinStep } from './SetPinStep';
import { ProfileCreateStep } from './ProfileCreateStep';

type Step = 'auth' | 'setPin' | 'profile' | 'done';

function computeStep(
  session: unknown,
  hasPin: boolean | undefined,
  profileCount: number,
  pinReset: boolean
): Step {
  if (!session) return 'auth';
  if (pinReset) return 'setPin';
  if (!hasPin) return 'setPin';
  if (profileCount === 0) return 'profile';
  return 'done';
}

export default function LoginPage() {
  const { session, account, profiles, loading } = useAuth();
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();
  const pinReset = sp.get('pinReset') === '1';
  const [authMode, setAuthMode] = useState<'signIn' | 'signUp'>('signIn');

  const step: Step = useMemo(
    () => computeStep(session, account?.hasPin, profiles.length, pinReset),
    [session, account, profiles.length, pinReset]
  );

  useEffect(() => {
    if (step === 'done') navigate('/library', { replace: true });
  }, [step, navigate]);

  useEffect(() => {
    if (pinReset && step === 'setPin') {
      const t = setTimeout(() => {
        sp.delete('pinReset');
        setSp(sp, { replace: true });
      }, 100);
      return () => clearTimeout(t);
    }
  }, [pinReset, step, sp, setSp]);

  if (loading) return null;

  if (step === 'auth') {
    return authMode === 'signIn' ? (
      <SignInForm onSwitchToSignUp={() => setAuthMode('signUp')} />
    ) : (
      <SignUpForm onSwitchToSignIn={() => setAuthMode('signIn')} />
    );
  }
  if (step === 'setPin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50 p-4">
        <SetPinStep />
      </div>
    );
  }
  if (step === 'profile') return <ProfileCreateStep />;
  return null;
}
