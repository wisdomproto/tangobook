import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SignInForm } from './SignInForm';
import { SignUpForm } from './SignUpForm';
import { SetPinStep } from './SetPinStep';
import { ProfileCreateStep } from './ProfileCreateStep';
import { PIN_REQUIRED } from '@/config/features';

type Step = 'auth' | 'setPin' | 'profile' | 'done';

function computeStep(
  session: unknown,
  hasPin: boolean | undefined,
  profileCount: number,
  pinReset: boolean
): Step {
  if (!session) return 'auth';
  if (PIN_REQUIRED) {
    if (pinReset) return 'setPin';
    if (!hasPin) return 'setPin';
  }
  if (profileCount === 0) return 'profile';
  return 'done';
}

export default function LoginPage() {
  const { session, account, profiles, loading } = useAuth();
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();
  const pinReset = sp.get('pinReset') === '1';
  // 가입 의도 CTA("무료로 시작하기" 등)는 ?mode=signup 으로 진입 — 로그인 폼에 떨어뜨리지 않기.
  const [authMode, setAuthMode] = useState<'signIn' | 'signUp'>(() =>
    sp.get('mode') === 'signup' ? 'signUp' : 'signIn'
  );

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

  // 'auth' 단계만 뒤로가기 노출 (setPin/profile 은 진행 중 단계라 막음)
  const backButton =
    step === 'auth' ? (
      <button
        onClick={() => navigate('/library')}
        className="fixed top-4 left-4 z-50 px-4 py-2 rounded-full bg-white shadow-soft text-ink-700 font-bold text-sm hover:bg-peach-100 transition"
        title="라이브러리로 돌아가기"
      >
        ← 돌아가기
      </button>
    ) : null;

  if (step === 'auth') {
    return (
      <>
        {backButton}
        {authMode === 'signIn' ? (
          <SignInForm onSwitchToSignUp={() => setAuthMode('signUp')} />
        ) : (
          <SignUpForm onSwitchToSignIn={() => setAuthMode('signIn')} />
        )}
      </>
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
