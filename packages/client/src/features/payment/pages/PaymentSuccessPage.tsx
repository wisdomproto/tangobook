import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { paymentApi } from '../api/payment.api';
import { ENTITLEMENT_QUERY_KEY } from '../hooks/useEntitlement';
import { useAuth } from '@/features/auth/context/AuthContext';

type Status = 'confirming' | 'success' | 'error';

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { account } = useAuth();
  const [status, setStatus] = useState<Status>('confirming');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const confirmed = useRef(false);

  useEffect(() => {
    if (confirmed.current) return;
    confirmed.current = true;

    const paymentKey = searchParams.get('paymentKey');
    const orderId = searchParams.get('orderId');
    const amountRaw = searchParams.get('amount');

    if (!paymentKey || !orderId || !amountRaw) {
      setErrorMsg('결제 정보가 올바르지 않습니다.');
      setStatus('error');
      return;
    }

    const amount = Number(amountRaw);
    if (Number.isNaN(amount)) {
      setErrorMsg('결제 금액이 올바르지 않습니다.');
      setStatus('error');
      return;
    }

    paymentApi
      .confirm({ paymentKey, orderId, amount })
      .then(() => {
        // Invalidate entitlement so useAccess picks up the new paidUntil immediately
        if (account) {
          void queryClient.invalidateQueries({ queryKey: ENTITLEMENT_QUERY_KEY(account.id) });
        }
        setStatus('success');
        setTimeout(() => navigate('/library', { replace: true }), 2000);
      })
      .catch((err: unknown) => {
        setErrorMsg(err instanceof Error ? err.message : '결제 승인에 실패했습니다.');
        setStatus('error');
      });
  }, [searchParams, queryClient, account, navigate]);

  if (status === 'confirming') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-peach-50 px-4">
        <div className="text-4xl">⏳</div>
        <p className="font-display text-xl font-black text-ink-900 break-keep">결제 확인 중…</p>
        <p className="text-sm text-slate-500 break-keep">잠시만 기다려 주세요.</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-peach-50 px-4 text-center">
        <div className="text-4xl">❌</div>
        <p className="font-display text-xl font-black text-ink-900 break-keep">결제 실패</p>
        <p className="text-sm text-red-600 break-keep">{errorMsg}</p>
        <button
          type="button"
          onClick={() => navigate('/subscribe')}
          className="mt-4 rounded-full bg-coral-500 px-6 py-3 font-black text-white shadow-pop hover:bg-coral-600"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-peach-50 px-4 text-center">
      <div className="text-5xl">🎉</div>
      <p className="font-display text-2xl font-black text-ink-900 break-keep">구독 완료!</p>
      <p className="text-slate-600 break-keep">탱고북의 모든 콘텐츠를 즐겨보세요.</p>
      <p className="text-sm text-slate-400">라이브러리로 이동합니다…</p>
    </div>
  );
}
