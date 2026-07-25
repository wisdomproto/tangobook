import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '@tangobook/shared';
import { setUiLanguage, AVAILABLE_UI_LANGS } from '@/i18n';
import { authApi } from '../api/auth.api';
import { SocialAuthButtons } from './SocialAuthButtons';
import { BetaOfferNote } from '@/features/access/components/BetaOfferNote';

interface Props {
  onSwitchToSignIn: () => void;
}

/** Supabase 에러 메시지를 부모 친화적인 문구 키로 매핑 (raw 영문 노출 방지). */
function signUpErrorKey(err: unknown): string {
  const msg = err instanceof Error ? err.message : '';
  if (/already registered|already exists|User already/i.test(msg))
    return 'signUp.error.alreadyRegistered';
  if (/invalid.*email|email.*invalid/i.test(msg)) return 'signUp.error.invalidEmail';
  if (/password/i.test(msg)) return 'signUp.error.password';
  return 'signUp.error.generic';
}

export function SignUpForm({ onSwitchToSignIn }: Props) {
  const { t, i18n } = useTranslation('auth');
  // 가입 시 언어 선택(필수). 기본 = 현재 UI 언어(진입 링크 /en 등으로 이미 설정됨).
  // 바꾸면 폼이 즉시 그 언어로 다시 그려지고, 이후 앱 전체가 그 언어로 시작.
  const [lang, setLang] = useState(i18n.language);
  const uiLangs = SUPPORTED_LANGUAGES.filter((l) => AVAILABLE_UI_LANGS.includes(l.code));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 이메일 확인이 필요한 경우(세션 미발급) → 확인 대기 화면으로 전환.
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent'>('idle');

  const canSubmit = !busy && !!email && password.length >= 6 && password === confirm;

  const handleSignUp = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      const data = await authApi.signUp(email, password);
      // 이메일 확인 OFF(자동 확인) → 세션 즉시 발급 → AuthContext 리스너가 다음 단계(프로필)로 진행.
      // 이 컴포넌트는 곧 unmount 되므로 별도 처리 불필요.
      if (data.session) return;
      // 이미 가입+확인된 이메일 재가입 — Supabase 는 enumeration 방지로 에러 대신
      // identities 가 빈 가짜 user 를 반환. 이때 "메일함 확인" 화면에 두면 메일이 영원히 안 옴.
      if (data.user && (data.user.identities?.length ?? 0) === 0) {
        setError(t('signUp.error.alreadyRegistered'));
        return;
      }
      // 이메일 확인 ON → 확인 대기 화면. (alert + 로그인폼 튕김 대신)
      setSentTo(email);
    } catch (err) {
      setError(t(signUpErrorKey(err)));
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    if (!sentTo || resendState === 'sending') return;
    setResendState('sending');
    try {
      await authApi.resendConfirmation(sentTo);
    } catch {
      // enumeration 방지 — 성공/실패 동일 처리
    }
    setResendState('sent');
  };

  // ── 이메일 확인 대기 화면 ──────────────────────────────────────────────
  if (sentTo) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-cream-50 p-4">
        <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-pop flex flex-col gap-4 text-center">
          <div className="text-5xl" aria-hidden>
            📬
          </div>
          <h1 className="text-2xl font-black text-ink-900">{t('signUp.emailSent.title')}</h1>
          <p className="text-ink-600 leading-relaxed">
            <Trans
              t={t}
              i18nKey="signUp.emailSent.body"
              values={{ email: sentTo }}
              components={{ email: <span className="font-black text-ink-900 break-all" /> }}
            />
          </p>
          <button
            onClick={handleResend}
            disabled={resendState !== 'idle'}
            className="h-12 rounded-xl border-2 border-coral-400 text-coral-600 font-black hover:bg-coral-50 disabled:opacity-50"
          >
            {resendState === 'sending'
              ? t('signUp.emailSent.resending')
              : resendState === 'sent'
                ? t('signUp.emailSent.resent')
                : t('signUp.emailSent.resend')}
          </button>
          <div className="rounded-xl bg-peach-50 p-3 text-sm text-ink-600">
            {t('signUp.emailSent.socialTip')}
          </div>
          <button onClick={onSwitchToSignIn} className="text-sm text-ink-500 hover:text-coral-500">
            {t('signUp.emailSent.backToSignIn')}
          </button>
        </div>
      </div>
    );
  }

  // ── 가입 폼 ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-cream-50 p-4">
      {/* short(모바일 가로) = 세로 부족 → (언어+소셜) | (이메일) 2단으로 눕혀 가입 버튼이 접힘 위로. */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 short:p-5 max-w-sm short:max-w-2xl w-full shadow-pop flex flex-col gap-4 short:gap-3">
        <div className="text-center">
          <h1 className="text-3xl short:text-2xl font-black text-ink-900">{t('signUp.title')}</h1>
          <p className="text-sm text-ink-500 mt-1 break-keep short:hidden">
            {t('signUp.subtitle')}
          </p>
          <BetaOfferNote className="short:hidden" />
        </div>
        <div className="flex flex-col gap-4 short:flex-row short:items-start short:gap-6">
          <div className="flex flex-col gap-4 short:flex-1 short:gap-3">
            {/* 언어 선택 — 바꾸면 폼·앱 전체가 그 언어로. 기본 = 진입 시 UI 언어. */}
            <label className="flex items-center gap-2 rounded-xl border-2 border-ink-100 px-3 h-12 focus-within:border-coral-500">
              <span className="text-lg" aria-hidden>
                🌐
              </span>
              <select
                value={lang}
                onChange={(e) => {
                  setLang(e.target.value);
                  void setUiLanguage(e.target.value, { explicit: true });
                }}
                aria-label={t('signUp.language', { defaultValue: 'Language' })}
                className="flex-1 bg-transparent font-bold text-ink-900 outline-none cursor-pointer"
              >
                {uiLangs.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.nativeName}
                  </option>
                ))}
              </select>
            </label>
            <SocialAuthButtons mode="signup" />
            <div className="flex items-center gap-3 text-sm text-ink-400 short:hidden">
              <div className="h-px flex-1 bg-ink-100" />
              {t('signUp.orWithEmail')}
              <div className="h-px flex-1 bg-ink-100" />
            </div>
          </div>
          <div className="flex flex-col gap-4 short:flex-1 short:gap-3">
            {error && (
              <p className="rounded-xl bg-danger/10 text-danger text-sm font-bold px-4 py-3 break-keep">
                {error}
              </p>
            )}
            <input
              type="email"
              placeholder={t('signUp.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-14 short:h-12 text-xl rounded-xl border-2 border-ink-100 px-4 focus:border-coral-500 outline-none"
            />
            <input
              type="password"
              placeholder={t('signUp.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-14 short:h-12 text-xl rounded-xl border-2 border-ink-100 px-4 focus:border-coral-500 outline-none"
            />
            <input
              type="password"
              placeholder={t('signUp.confirmPlaceholder')}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="h-14 short:h-12 text-xl rounded-xl border-2 border-ink-100 px-4 focus:border-coral-500 outline-none"
            />
            {confirm && password !== confirm && (
              <p className="text-danger text-sm">{t('signUp.passwordMismatch')}</p>
            )}
            <button
              onClick={handleSignUp}
              disabled={!canSubmit}
              className="h-14 short:h-12 rounded-xl bg-coral-500 text-white font-black text-lg hover:brightness-110 disabled:bg-ink-300"
            >
              {busy ? t('signUp.submitting') : t('signUp.submit')}
            </button>
          </div>
        </div>
        <p className="text-center text-xs text-ink-400 break-keep">
          <Trans
            t={t}
            i18nKey="signUp.terms"
            components={{
              termsLink: (
                <a
                  href="/terms"
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-ink-600"
                />
              ),
              privacyLink: (
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-ink-600"
                />
              ),
            }}
          />
        </p>
        <button
          onClick={onSwitchToSignIn}
          className="text-sm text-ink-500 mt-2 hover:text-coral-500"
        >
          {t('signUp.haveAccount')}
        </button>
      </div>
    </div>
  );
}
