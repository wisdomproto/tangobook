import { useState } from 'react';
import { authApi } from '../api/auth.api';
import { supabase } from '@/lib/supabase';
import { PIN_REQUIRED } from '@/config/features';
import { SocialAuthButtons } from './SocialAuthButtons';

interface Props {
  onSwitchToSignUp: () => void;
}

function friendlySignInError(err: unknown): string {
  const msg = err instanceof Error ? err.message : '';
  if (/invalid login credentials|invalid.*credentials/i.test(msg))
    return '이메일 또는 비밀번호가 틀려요.';
  if (/email not confirmed|not confirmed/i.test(msg))
    return '이메일 확인이 필요해요. 메일함의 링크를 눌러 주세요.';
  return '로그인에 실패했어요. 잠시 후 다시 시도해 주세요.';
}

export function SignInForm({ onSwitchToSignUp }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleSignIn = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await authApi.signIn(email, password);
    } catch (err) {
      setError(friendlySignInError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('이메일을 먼저 입력해 주세요.');
      return;
    }
    try {
      await supabase.auth.resetPasswordForEmail(email);
    } catch {
      // enumeration 방지 — 성공/실패 동일 안내
    }
    setError(null);
    setNotice('비밀번호 재설정 메일을 보냈어요. 메일함을 확인해 주세요.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-pop flex flex-col gap-4">
        <div className="text-center">
          <h1 className="text-3xl font-black text-ink-900">탱고북</h1>
          <p className="text-sm text-ink-500 mt-1 break-keep">
            부모님 계정으로 로그인 · 7일 무료 체험 · 학습 리포트
          </p>
        </div>
        <SocialAuthButtons mode="signin" />
        <div className="flex items-center gap-3 text-sm text-ink-400">
          <div className="h-px flex-1 bg-ink-100" />
          또는 이메일로
          <div className="h-px flex-1 bg-ink-100" />
        </div>
        {error && (
          <p className="rounded-xl bg-danger/10 text-danger text-sm font-bold px-4 py-3 break-keep">
            {error}
          </p>
        )}
        {notice && (
          <p className="rounded-xl bg-mint-50 text-mint-700 text-sm font-bold px-4 py-3 break-keep">
            {notice}
          </p>
        )}
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-14 text-xl rounded-xl border-2 border-ink-100 px-4 focus:border-coral-500 outline-none"
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-14 text-xl rounded-xl border-2 border-ink-100 px-4 focus:border-coral-500 outline-none"
        />
        <button
          onClick={handleSignIn}
          disabled={busy || !email || !password}
          className="h-14 rounded-xl bg-coral-500 text-white font-black text-lg hover:brightness-110 disabled:bg-ink-300"
        >
          {busy ? '로그인 중…' : '로그인'}
        </button>
        <div className="flex justify-between text-sm text-ink-500 mt-2">
          <button onClick={onSwitchToSignUp} className="font-bold hover:text-coral-500">
            회원가입
          </button>
          <button onClick={handleResetPassword} className="hover:text-coral-500">
            비밀번호 찾기
          </button>
          {/* PIN 미사용(PIN_REQUIRED=false) 동안엔 PIN 분실 링크 숨김 — 겪지 않은 기능의 복구 노출 방지 */}
          {PIN_REQUIRED && (
            <button
              onClick={async () => {
                const e = window.prompt('이메일을 입력해주세요', email);
                if (!e) return;
                try {
                  await authApi.requestPinReset(e);
                } catch {
                  // enumeration 방지
                }
                setNotice('PIN 재설정 메일을 보냈어요. 메일함을 확인해 주세요.');
              }}
              className="hover:text-coral-500"
            >
              PIN 잊었어요
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
