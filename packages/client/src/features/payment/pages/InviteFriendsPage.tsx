import { useEffect, useState } from 'react';
import { apiPost } from '@/lib/axios';
import { useAuth } from '@/features/auth/context/AuthContext';
import { RedeemCodeInput } from '../components/RedeemCodeInput';
import { buildInviteLink, buildInviteMessage } from '../lib/invite-message';

interface ReferralCodeResponse {
  code: string;
}

const STEPS = [
  { n: 1, t: '아래 "초대 메시지 복사"를 눌러요' },
  { n: 2, t: '카톡·문자로 친구에게 붙여넣어 보내요' },
  { n: 3, t: '친구가 링크로 가입해요 (코드 자동 적용)' },
  { n: 4, t: '둘 다 무료 기간 +7일 🎉' },
];

/** 친구 초대 전용 화면 — 큰 코드 표시 + 사용법 + 받은 코드 입력. 사이드바 "친구 초대" 진입. */
export default function InviteFriendsPage() {
  const { account } = useAuth();
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
          친구 초대하고 둘 다 +7일
        </h1>
        <p className="mt-1 text-ink-500 font-bold break-keep">
          친구도 나도 무료 기간이 7일씩 늘어나요 (각 최대 28일)
        </p>
      </div>

      {/* 내 코드 */}
      <div className="rounded-3xl bg-white p-6 shadow-soft text-center">
        <p className="text-sm font-black text-ink-500 mb-2">내 초대 코드</p>
        {error ? (
          <p className="text-danger font-bold">코드를 불러오지 못했어요. 새로고침해 주세요.</p>
        ) : (
          <>
            <div className="text-3xl font-black tracking-[0.3em] text-ink-900 select-all mb-1 uppercase">
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
              {copied ? '복사됨 ✓ 카톡에 붙여넣으세요' : '초대 메시지 복사'}
            </button>
          </>
        )}
      </div>

      {/* 사용법 */}
      <ol className="mt-6 space-y-2.5">
        {STEPS.map((s) => (
          <li key={s.n} className="flex items-center gap-3 rounded-2xl bg-white/70 px-4 py-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-coral-500 text-white font-black">
              {s.n}
            </span>
            <span className="font-bold text-ink-800 break-keep">{s.t}</span>
          </li>
        ))}
      </ol>

      {/* 받은 코드 입력 */}
      <div className="mt-6 rounded-3xl bg-white p-6 shadow-soft">
        <p className="font-black text-ink-900 mb-2">받은 코드가 있나요?</p>
        <RedeemCodeInput />
      </div>
    </div>
  );
}
