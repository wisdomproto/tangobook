import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiPost } from '@/lib/axios';
import { useAuth } from '@/features/auth/context/AuthContext';
import { buildInviteLink, buildInviteMessage } from '../lib/invite-message';

interface ReferralCodeResponse {
  code: string;
}

/** 친구 초대 전용 화면 — 큰 코드 표시 + 사용법 + 받은 코드 입력. 사이드바 "친구 초대" 진입. */
export default function InviteFriendsPage() {
  const { t } = useTranslation('payment');
  const { account } = useAuth();
  const steps = [1, 2, 3, 4].map((n) => ({ n, t: t(`inviteFriends.step${n}`) }));
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!account) return;
    let alive = true;
    apiPost<ReferralCodeResponse>('/payments/referral/code', {})
      .then((d) => {
        if (alive) setCode(d.code);
      })
      .catch(() => {
        if (alive) setError(true);
      });
    return () => {
      alive = false;
    };
  }, [account]);

  const copyMessage = () => {
    if (!code) return;
    void navigator.clipboard.writeText(buildInviteMessage(code)).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      },
      () => {}
    );
  };

  return (
    <div className="mx-auto max-w-lg px-5 py-8">
      <div className="text-center mb-6">
        <div className="text-5xl mb-2" aria-hidden>
          🎁
        </div>
        <h1 className="font-display text-2xl font-black text-ink-900 break-keep">
          {t('inviteFriends.title')}
        </h1>
        <p className="mt-1 text-ink-500 font-bold break-keep">{t('inviteFriends.subtitle')}</p>
      </div>

      {/* 내 코드 */}
      <div className="rounded-3xl bg-white p-6 shadow-soft text-center">
        <p className="text-sm font-black text-ink-500 mb-2">{t('inviteFriends.myCode')}</p>
        {error ? (
          <p className="text-danger font-bold">{t('inviteFriends.loadCodeError')}</p>
        ) : (
          <>
            <div className="text-2xl sm:text-3xl font-black tracking-[0.2em] sm:tracking-[0.3em] text-ink-900 select-all mb-1 uppercase break-all">
              {code ?? '••••••'}
            </div>
            {code && (
              <p className="text-xs text-ink-400 font-bold select-all break-all mb-3">
                {buildInviteLink(code)}
              </p>
            )}
            <button
              type="button"
              onClick={copyMessage}
              disabled={!code}
              className="rounded-full bg-coral-500 px-8 py-3 font-black text-white shadow-soft hover:bg-coral-600 disabled:opacity-40"
            >
              {copied ? t('inviteFriends.copied') : t('inviteFriends.copyMessage')}
            </button>
          </>
        )}
      </div>

      {/* 사용법 */}
      <ol className="mt-6 space-y-2.5">
        {steps.map((s) => (
          <li key={s.n} className="flex items-center gap-3 rounded-2xl bg-white/70 px-4 py-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-coral-500 text-white font-black">
              {s.n}
            </span>
            <span className="font-bold text-ink-800 break-keep">{s.t}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
