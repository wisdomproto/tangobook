import { asyncHandler } from '../middleware/async-handler.js';
import { getAccountIdFromRequest } from '../middleware/account-auth.js';
import { createCheckout, confirmPayment, handleWebhook } from '../services/payment.service.js';

export const PaymentController = {
  postCheckout: asyncHandler(async (req, res) => {
    const accountId = await getAccountIdFromRequest(req);
    const { plan: planId } = req.body as { plan?: string };
    const data = await createCheckout(accountId, planId);
    res.json({ success: true, data });
  }),

  postConfirm: asyncHandler(async (req, res) => {
    const accountId = await getAccountIdFromRequest(req);
    const { paymentKey, orderId, amount } = req.body as {
      paymentKey?: string;
      orderId?: string;
      amount?: unknown;
    };
    const data = await confirmPayment(accountId, {
      paymentKey: paymentKey ?? '',
      orderId: orderId ?? '',
      amount: Number(amount),
    });
    res.json({ success: true, data });
  }),

  postWebhook: asyncHandler(async (req, res) => {
    // NO auth — Toss calls this server-to-server
    await handleWebhook(req.body);
    res.json({ success: true });
  }),
};
