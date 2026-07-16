import { useState } from 'react';
import { loadTossPayments } from '@tosspayments/tosspayments-sdk';
import type { PlanId } from '@tangobook/shared';
import { paymentApi } from '../api/payment.api';
import { useAuth } from '@/features/auth/context/AuthContext';

const CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY as string | undefined;

/** 토스 클라이언트 키가 설정되어 실제 결제창을 열 수 있는 상태인지. */
export const isCheckoutConfigured = Boolean(CLIENT_KEY);

interface UseCheckoutState {
  loading: boolean;
  error: string | null;
}

/**
 * 주문 생성(POST /payments/checkout) — 서버 재시작 창(Railway 프록시 "no healthy upstream" 등
 * transient 5xx)에 걸리기 쉬운 첫 호출이라 transient 에러면 짧게 한 번 재시도한다.
 * 짧은 blip 은 사용자 눈에 안 보이게 넘어가고, 재시도도 실패하면 친절 메시지가 노출된다.
 * (재시도 시 pending payments 행이 하나 더 생기지만 confirm 안 되면 무해 — 권한 X.)
 */
async function requestCheckoutWithRetry(planId: PlanId) {
  try {
    return await paymentApi.checkout(planId);
  } catch (err) {
    if ((err as { transient?: boolean })?.transient) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return await paymentApi.checkout(planId);
    }
    throw err;
  }
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
      const { orderId, amount, orderName } = await requestCheckoutWithRetry(planId);

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
