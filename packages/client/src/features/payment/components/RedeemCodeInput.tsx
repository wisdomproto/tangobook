import { useState } from 'react';
import { apiPost } from '@/lib/axios';

interface RedeemResult {
  ok: boolean;
  reason?: string;
  inviterBonus?: number;
}

function reasonMessage(reason?: string): string {
  switch (reason) {
    case 'self_referral':
      return '본인 코드는 사용할 수 없어요.';
    case 'already_referred':
      return '이미 초대 코드를 사용했어요.';
    case 'cap_reached':
      return '무료 기간이 이미 최대예요.';
    case 'invalid_code':
    case 'not_found':
      return '올바르지 않은 코드예요. 다시 확인해 주세요.';
    default:
      return '코드를 적용할 수 없어요.';
  }
}

/**
 * 받은 초대 코드 입력 폼. 친구가 회원 가입 후 여기에 코드를 넣으면 redeem.
 * (보상은 초대한 친구에게 +7일 적립 — 서버 RPC 가 자기초대·중복·상한 방어.)
 */
export function RedeemCodeInput() {
  const [code, setCode] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'ok' | 'err'>('idle');
  const [msg, setMsg] = useState('');

  const submit = async () => {
    const c = code.trim().toUpperCase();
    if (!c || state === 'busy') return;
    setState('busy');
    setMsg('');
    try {
      const res = await apiPost<RedeemResult>('/payments/referral/redeem', { code: c });
      if (res.ok) {
        setState('ok');
        setMsg('코드를 적용했어요! 🎉 초대해준 친구에게 무료 기간이 쌓여요.');
      } else {
        setState('err');
        setMsg(reasonMessage(res.reason));
      }
    } catch {
      setState('err');
      setMsg('적용에 실패했어요. 잠시 후 다시 시도해 주세요.');
    }
  };

  if (state === 'ok') {
    return (
      <p className="rounded-xl bg-mint-50 text-mint-700 text-sm font-bold px-4 py-3 break-keep">
        {msg}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 12))}
          placeholder="받은 코드 입력"
          className="flex-1 min-w-0 rounded-xl border-2 border-ink-100 px-4 py-2.5 font-black tracking-widest text-ink-900 uppercase outline-none focus:border-coral-400"
          aria-label="받은 초대 코드"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!code.trim() || state === 'busy'}
          className="shrink-0 rounded-xl bg-mint-500 px-5 py-2.5 font-black text-white hover:brightness-110 disabled:opacity-40"
        >
          {state === 'busy' ? '적용 중…' : '적용'}
        </button>
      </div>
      {state === 'err' && <p className="text-danger text-xs font-bold break-keep">{msg}</p>}
    </div>
  );
}
