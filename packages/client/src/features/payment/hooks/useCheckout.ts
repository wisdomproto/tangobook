import { useState } from 'react';
import { loadTossPayments } from '@tosspayments/tosspayments-sdk';
import type { PlanId } from '@tangobook/shared';
import { paymentApi } from '../api/payment.api';
import { useAuth } from '@/features/auth/context/AuthContext';

const CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY as string | undefined;

interface UseCheckoutState {
  loading: boolean;
  error: string | null;
}

/**
 * Initiates the Toss Payments checkout flow for a plan.
 *
 * Flow:
 * 1. POST /payments/checkout → { orderId, amount, orderName }
 * 2. loadTossPayments(clientKey) → sdk
 * 3. sdk.payment({ customerKey: account.id }) → payment object
 * 4. payment.requestPayment({ method:'CARD', amount, orderId, orderName, successUrl, failUrl })
 *    → browser redirects to successUrl or failUrl
 */
export function useCheckout() {
  const { account } = useAuth();
  const [state, setState] = useState<UseCheckoutState>({ loading: false, error: null });

  async function startCheckout(planId: PlanId) {
    if (!CLIENT_KEY) {
      setState({ loading: false, error: 'Toss client key not configured (VITE_TOSS_CLIENT_KEY)' });
      return;
    }
    if (!account) {
      setState({ loading: false, error: '로그인이 필요합니다.' });
      return;
    }

    setState({ loading: true, error: null });
    try {
      const { orderId, amount, orderName } = await paymentApi.checkout(planId);

      const tossPayments = await loadTossPayments(CLIENT_KEY);
      const payment = tossPayments.payment({ customerKey: account.id });

      await payment.requestPayment({
        method: 'CARD',
        amount: { currency: 'KRW', value: amount },
        orderId,
        orderName,
        successUrl: window.location.origin + '/payments/success',
        failUrl: window.location.origin + '/payments/fail',
      });
      // If successUrl redirect fires, code below won't execute.
      // If promise returns (e.g. iframe mode), set loading false.
      setState({ loading: false, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : '결제 요청에 실패했습니다.';
      // User cancel is a normal flow — surface it only as non-loading state
      setState({ loading: false, error: message.includes('CANCEL') ? null : message });
    }
  }

  return { startCheckout, loading: state.loading, error: state.error };
}
