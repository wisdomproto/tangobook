import { useState } from 'react';
import { authApi } from '../api/auth.api';
import { SocialAuthButtons } from './SocialAuthButtons';

interface Props {
  onSwitchToSignIn: () => void;
}

/** Supabase 에러 메시지를 부모 친화적인 한국어로 매핑 (raw 영문 노출 방지). */
function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : '';
  if (/already registered|already exists|User already/i.test(msg))
    return '이미 가입된 이메일이에요. 로그인해 주세요.';
  if (/invalid.*email|email.*invalid/i.test(msg)) return '이메일 형식을 확인해 주세요.';
  if (/password/i.test(msg)) return '비밀번호는 6자 이상이어야 해요.';
  return '가입에 실패했어요. 잠시 후 다시 시도해 주세요.';
}

export function SignUpForm({ onSwitchToSignIn }: Props) {
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
      // 이메일 확인 ON → 확인 대기 화면. (alert + 로그인폼 튕김 대신)
      setSentTo(email);
    } catch (err) {
      setError(friendlyError(err));
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
      <div className="min-h-screen flex items-center justify-center bg-cream-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-pop flex flex-col gap-4 text-center">
          <div className="text-5xl" aria-hidden>
            📬
          </div>
          <h1 className="text-2xl font-black text-ink-900">메일함을 확인해 주세요</h1>
          <p className="text-ink-600 leading-relaxed">
            <span className="font-black text-ink-900 break-all">{sentTo}</span> 으로 확인 링크를
            보냈어요. 링크를 누르면 바로 시작돼요.
          </p>
          <button
            onClick={handleResend}
            disabled={resendState !== 'idle'}
            className="h-12 rounded-xl border-2 border-coral-400 text-coral-600 font-black hover:bg-coral-50 disabled:opacity-50"
          >
            {resendState === 'sending'
              ? '보내는 중…'
              : resendState === 'sent'
                ? '메일을 다시 보냈어요 ✓'
                : '메일 다시 보내기'}
          </button>
          <div className="rounded-xl bg-peach-50 p-3 text-sm text-ink-600">
            💡 카카오·구글로 회원 가입하면 이메일 확인 없이 바로 시작해요
          </div>
          <button onClick={onSwitchToSignIn} className="text-sm text-ink-500 hover:text-coral-500">
            로그인으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // ── 가입 폼 ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-pop flex flex-col gap-4">
        <div className="text-center">
          <h1 className="text-3xl font-black text-ink-900">회원가입</h1>
          <p className="text-sm text-ink-500 mt-1 break-keep">
            부모님 계정으로 시작해요 · 아이는 가입 후 등록 (최대 4명)
          </p>
        </div>
        <SocialAuthButtons mode="signup" />
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
          {busy ? '가입 중…' : '가입하기'}
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
