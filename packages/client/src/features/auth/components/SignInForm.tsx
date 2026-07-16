import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { authApi } from '../api/auth.api';
import { supabase } from '@/lib/supabase';
import { PIN_REQUIRED } from '@/config/features';
import { SocialAuthButtons } from './SocialAuthButtons';

interface Props {
  onSwitchToSignUp: () => void;
}

function signInErrorKey(err: unknown): string {
  const msg = err instanceof Error ? err.message : '';
  if (/invalid login credentials|invalid.*credentials/i.test(msg))
    return 'signIn.error.invalidCredentials';
  if (/email not confirmed|not confirmed/i.test(msg)) return 'signIn.error.emailNotConfirmed';
  return 'signIn.error.generic';
}

export function SignInForm({ onSwitchToSignUp }: Props) {
  const { t } = useTranslation('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // 이메일 미확인 로그인 실패 → 재전송 버튼 노출 (확인 메일이 스팸함에 갔을 때 dead-end 방지)
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);

  const handleSignIn = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    setUnconfirmedEmail(null);
    try {
      await authApi.signIn(email, password);
    } catch (err) {
      setError(t(signInErrorKey(err)));
      const raw = err instanceof Error ? err.message : '';
      if (/not confirmed/i.test(raw)) setUnconfirmedEmail(email);
    } finally {
      setBusy(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!unconfirmedEmail) return;
    try {
      await authApi.resendConfirmation(unconfirmedEmail);
    } catch {
      // enumeration 방지 — 성공/실패 동일 안내
    }
    setError(null);
    setUnconfirmedEmail(null);
    setNotice(t('signIn.notice.confirmationResent'));
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError(t('signIn.error.emailRequired'));
      return;
    }
    try {
      await supabase.auth.resetPasswordForEmail(email);
    } catch {
      // enumeration 방지 — 성공/실패 동일 안내
    }
    setError(null);
    setNotice(t('signIn.notice.passwordResetSent'));
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-cream-50 p-4">
      {/* short(모바일 가로) = 세로 공간 부족 → 소셜 | 이메일 2단으로 눕혀 로그인 버튼이 접힘 위로. */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 short:p-5 max-w-sm short:max-w-2xl w-full shadow-pop flex flex-col gap-4 short:gap-3">
        <div className="text-center">
          <h1 className="text-3xl short:text-2xl font-black text-ink-900">{t('signIn.title')}</h1>
          <p className="text-sm text-ink-500 mt-1 break-keep short:hidden">
            {t('signIn.subtitle')}
          </p>
        </div>
        <div className="flex flex-col gap-4 short:flex-row short:items-center short:gap-6">
          <div className="short:flex-1">
            <SocialAuthButtons mode="signin" />
          </div>
          <div className="flex items-center gap-3 text-sm text-ink-400 short:hidden">
            <div className="h-px flex-1 bg-ink-100" />
            {t('signIn.orWithEmail')}
            <div className="h-px flex-1 bg-ink-100" />
          </div>
          <div className="flex flex-col gap-4 short:flex-1 short:gap-3">
            {error && (
              <p className="rounded-xl bg-danger/10 text-danger text-sm font-bold px-4 py-3 break-keep">
                {error}
              </p>
            )}
            {unconfirmedEmail && (
              <button
                onClick={handleResendConfirmation}
                className="h-11 rounded-xl border-2 border-coral-400 text-coral-600 text-sm font-black hover:bg-coral-50"
              >
                {t('signIn.resendConfirmation')}
              </button>
            )}
            {notice && (
              <p className="rounded-xl bg-mint-50 text-mint-700 text-sm font-bold px-4 py-3 break-keep">
                {notice}
              </p>
            )}
            <input
              type="email"
              placeholder={t('signIn.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-14 short:h-12 text-xl rounded-xl border-2 border-ink-100 px-4 focus:border-coral-500 outline-none"
            />
            <input
              type="password"
              placeholder={t('signIn.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-14 short:h-12 text-xl rounded-xl border-2 border-ink-100 px-4 focus:border-coral-500 outline-none"
            />
            <button
              onClick={handleSignIn}
              disabled={busy || !email || !password}
              className="h-14 short:h-12 rounded-xl bg-coral-500 text-white font-black text-lg hover:brightness-110 disabled:bg-ink-300"
            >
              {busy ? t('signIn.submitting') : t('signIn.submit')}
            </button>
          </div>
        </div>
        <div className="flex justify-between text-sm text-ink-500 mt-2 short:mt-0">
          <button onClick={onSwitchToSignUp} className="font-bold hover:text-coral-500">
            {t('signIn.signUpLink')}
          </button>
          <button onClick={handleResetPassword} className="hover:text-coral-500">
            {t('signIn.forgotPassword')}
          </button>
          {/* PIN 미사용(PIN_REQUIRED=false) 동안엔 PIN 분실 링크 숨김 — 겪지 않은 기능의 복구 노출 방지 */}
          {PIN_REQUIRED && (
            <button
              onClick={async () => {
                const e = window.prompt(t('signIn.pinResetPrompt'), email);
                if (!e) return;
                try {
                  await authApi.requestPinReset(e);
                } catch {
                  // enumeration 방지
                }
                setNotice(t('signIn.notice.pinResetSent'));
              }}
              className="hover:text-coral-500"
            >
              {t('signIn.forgotPin')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
