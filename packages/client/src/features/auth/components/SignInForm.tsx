import { useState } from 'react';
import { authApi } from '../api/auth.api';
import { supabase } from '@/lib/supabase';

interface Props {
  onSwitchToSignUp: () => void;
}

export function SignInForm({ onSwitchToSignUp }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSignIn = async () => {
    setBusy(true);
    try {
      await authApi.signIn(email, password);
    } catch (err) {
      alert(err instanceof Error ? err.message : '로그인 실패');
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    try {
      await authApi.signInWithGoogle();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Google 로그인 실패');
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      alert('이메일을 먼저 입력해주세요');
      return;
    }
    try {
      await supabase.auth.resetPasswordForEmail(email);
      alert('이메일을 확인해주세요');
    } catch {
      alert('이메일을 확인해주세요');
    }
  };

  const handlePinReset = async () => {
    const e = window.prompt('이메일을 입력해주세요', email);
    if (!e) return;
    try {
      await authApi.requestPinReset(e);
    } catch {
      // 동일 메시지로 enumeration 방지
    }
    alert('이메일 보냈어요. 확인해주세요.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-pop flex flex-col gap-4">
        <h1 className="text-3xl font-black text-ink-900 text-center">탱고북</h1>
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
          로그인
        </button>
        <button
          onClick={handleGoogle}
          className="h-14 rounded-xl bg-white border-2 border-ink-100 text-ink-900 font-bold text-lg"
        >
          🌐 Google로 계속
        </button>
        <div className="flex justify-between text-sm text-ink-500 mt-2">
          <button onClick={onSwitchToSignUp} className="font-bold hover:text-coral-500">
            회원가입
          </button>
          <button onClick={handleResetPassword} className="hover:text-coral-500">
            비밀번호 찾기
          </button>
          <button onClick={handlePinReset} className="hover:text-coral-500">
            PIN 잊었어요
          </button>
        </div>
      </div>
    </div>
  );
}
