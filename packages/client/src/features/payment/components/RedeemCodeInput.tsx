import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiPost } from '@/lib/axios';
import { useAuth } from '@/features/auth/context/AuthContext';
import { playUi } from '@/lib/uiSound';
import { ENTITLEMENT_QUERY_KEY } from '../hooks/useEntitlement';

interface RedeemResult {
  ok: boolean;
  reason?: string;
  inviterBonus?: number;
  refereeBonus?: number;
  /** 실제 증가분 — cap(28일) 도달 시 0 (RPC 가 반환) */
  inviterDelta?: number;
  refereeDelta?: number;
}

// reason 은 RPC(supabase-referral.sql)가 반환하는 값과 1:1 매핑.
function reasonMessage(reason?: string): string {
  switch (reason) {
    case 'self':
      return '본인 코드는 사용할 수 없어요.';
    case 'already_referred':
      return '이미 초대 코드를 사용했어요.';
    case 'race':
      return '잠시 후 다시 시도해 주세요.';
    case 'invalid_code':
      return '올바르지 않은 코드예요. 다시 확인해 주세요.';
    default:
      return '코드를 적용할 수 없어요.';
  }
}

// cap(28일) 도달 시 거짓 "+7일" 축하를 하지 않도록 실제 증가분으로 문구 결정.
function successMessage(res: RedeemResult): string {
  const mine = res.refereeDelta;
  const friend = res.inviterDelta;
  if (typeof mine !== 'number' || typeof friend !== 'number') {
    return '코드를 적용했어요! 🎉 나도 +7일, 초대해준 친구도 +7일 늘었어요.';
  }
  if (mine > 0 && friend > 0)
    return '코드를 적용했어요! 🎉 나도 +7일, 초대해준 친구도 +7일 늘었어요.';
  if (mine > 0) return `코드를 적용했어요! 🎉 내 무료 기간이 +${mine}일 늘었어요.`;
  return '친구와 연결됐어요! 내 무료 기간은 이미 최대(28일)라 그대로예요.';
}

/**
 * 받은 초대 코드 입력 폼. 친구가 회원 가입 후 여기에 코드를 넣으면 redeem.
 * 양방향 보상 — 초대자·나 둘 다 +7일 (서버 RPC 가 자기초대·중복·상한 방어).
 */
export function RedeemCodeInput() {
  const { account } = useAuth();
  const queryClient = useQueryClient();
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
        playUi('success');
        setMsg(successMessage(res));
        if (account) {
          // 내 보상은 여기서 인라인으로 축하하므로, ReferralRewardToast 가 중복 축하하지 않게 기준값 갱신.
          if (typeof res.refereeBonus === 'number') {
            try {
              localStorage.setItem(`tb_ref_bonus_seen:${account.id}`, String(res.refereeBonus));
            } catch {
              // best-effort
            }
          }
          // 내 늘어난 무료기간을 UI 에 반영 (멤버십 상태 등).
          void queryClient.invalidateQueries({ queryKey: ENTITLEMENT_QUERY_KEY(account.id) });
        }
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
