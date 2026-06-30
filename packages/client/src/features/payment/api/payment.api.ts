import { apiPost } from '@/lib/axios';

export interface CheckoutResponse {
  orderId: string;
  amount: number;
  orderName: string;
}

export interface ConfirmResponse {
  paidUntil: string;
}

export const paymentApi = {
  checkout(plan: string): Promise<CheckoutResponse> {
    return apiPost<CheckoutResponse>('/payments/checkout', { plan });
  },

  confirm(params: {
    paymentKey: string;
    orderId: string;
    amount: number;
  }): Promise<ConfirmResponse> {
    return apiPost<ConfirmResponse>('/payments/confirm', params);
  },
};
