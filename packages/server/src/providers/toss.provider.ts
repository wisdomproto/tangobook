import { config } from '../config/index.js';
import { AppError } from '../middleware/error.middleware.js';

function tossBasicAuth(): string {
  return 'Basic ' + Buffer.from(config.toss.secretKey + ':').toString('base64');
}

interface TossConfirmArgs {
  paymentKey: string;
  orderId: string;
  amount: number;
}

interface TossPaymentResponse {
  paymentKey: string;
  orderId: string;
  status: string;
  totalAmount: number;
  [key: string]: unknown;
}

async function confirmPayment(args: TossConfirmArgs): Promise<TossPaymentResponse> {
  const res = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
    method: 'POST',
    headers: {
      Authorization: tossBasicAuth(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as { message?: string; code?: string };
      msg = body.message ?? body.code ?? msg;
    } catch {
      // ignore parse error
    }
    throw new AppError(402, `토스 승인 실패: ${msg}`);
  }

  return res.json() as Promise<TossPaymentResponse>;
}

async function getPayment(paymentKey: string): Promise<TossPaymentResponse> {
  const res = await fetch(`https://api.tosspayments.com/v1/payments/${paymentKey}`, {
    headers: { Authorization: tossBasicAuth() },
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as { message?: string; code?: string };
      msg = body.message ?? body.code ?? msg;
    } catch {
      // ignore parse error
    }
    throw new AppError(402, `토스 조회 실패: ${msg}`);
  }

  return res.json() as Promise<TossPaymentResponse>;
}

export const toss = { confirmPayment, getPayment };
