import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { paymentApi } from '../api/payment.api';
import { ENTITLEMENT_QUERY_KEY } from '../hooks/useEntitlement';
import { useAuth } from '@/features/auth/context/AuthContext';

type Status = 'confirming' | 'success' | 'error';

export default function PaymentSuccessPage() {
  const { t } = useTranslation('payment');
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
      setErrorMsg(t('paymentSuccess.invalidInfo'));
      setStatus('error');
      return;
    }

    const amount = Number(amountRaw);
    if (Number.isNaN(amount)) {
      setErrorMsg(t('paymentSuccess.invalidAmount'));
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
        setErrorMsg(err instanceof Error ? err.message : t('paymentSuccess.confirmFailed'));
        setStatus('error');
      });
  }, [searchParams, queryClient, account, navigate, t]);

  if (status === 'confirming') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-peach-50 px-4">
        <div className="text-4xl">⏳</div>
        <p className="font-display text-xl font-black text-ink-900 break-keep">
          {t('paymentSuccess.confirming')}
        </p>
        <p className="text-sm text-slate-500 break-keep">{t('paymentSuccess.wait')}</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-peach-50 px-4 text-center">
        <div className="text-4xl">❌</div>
        <p className="font-display text-xl font-black text-ink-900 break-keep">
          {t('paymentSuccess.failTitle')}
        </p>
        <p className="text-sm text-red-600 break-keep">{errorMsg}</p>
        <button
          type="button"
          onClick={() => navigate('/subscribe')}
          className="mt-4 rounded-full bg-coral-500 px-6 py-3 font-black text-white shadow-pop hover:bg-coral-600"
        >
          {t('paymentSuccess.retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-peach-50 px-4 text-center">
      <div className="text-5xl">🎉</div>
      <p className="font-display text-2xl font-black text-ink-900 break-keep">
        {t('paymentSuccess.successTitle')}
      </p>
      <p className="text-slate-600 break-keep">{t('paymentSuccess.successDesc')}</p>
      <p className="text-sm text-slate-400">{t('paymentSuccess.redirecting')}</p>
    </div>
  );
}
