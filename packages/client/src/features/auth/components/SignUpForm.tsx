import { useState } from 'react';
import { authApi } from '../api/auth.api';

interface Props {
  onSwitchToSignIn: () => void;
}

export function SignUpForm({ onSwitchToSignIn }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  const canSubmit = !busy && !!email && password.length >= 6 && password === confirm;

  const handleSignUp = async () => {
    if (!canSubmit) return;
    setBusy(true);
    try {
      await authApi.signUp(email, password);
      alert('확인 이메일을 보냈어요');
      onSwitchToSignIn();
    } catch (err) {
      alert(err instanceof Error ? err.message : '회원가입 실패');
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-pop flex flex-col gap-4">
        <h1 className="text-3xl font-black text-ink-900 text-center">회원가입</h1>
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-14 text-xl rounded-xl border-2 border-ink-100 px-4 focus:border-coral-500 outline-none"
        />
        <input
          type="password"
          placeholder="비밀번호 (6자 이상)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-14 text-xl rounded-xl border-2 border-ink-100 px-4 focus:border-coral-500 outline-none"
        />
        <input
          type="password"
          placeholder="비밀번호 확인"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="h-14 text-xl rounded-xl border-2 border-ink-100 px-4 focus:border-coral-500 outline-none"
        />
        {confirm && password !== confirm && (
          <p className="text-danger text-sm">비밀번호가 일치하지 않아요</p>
        )}
        <button
          onClick={handleSignUp}
          disabled={!canSubmit}
          className="h-14 rounded-xl bg-coral-500 text-white font-black text-lg hover:brightness-110 disabled:bg-ink-300"
        >
          가입하기
        </button>
        <button
          onClick={handleGoogle}
          className="h-14 rounded-xl bg-white border-2 border-ink-100 text-ink-900 font-bold text-lg"
        >
          🌐 Google로 계속
        </button>
        <button
          onClick={onSwitchToSignIn}
          className="text-sm text-ink-500 mt-2 hover:text-coral-500"
        >
          이미 계정이 있어요 → 로그인
        </button>
      </div>
    </div>
  );
}
