import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller.js';

const router = Router();

router.post('/checkout', PaymentController.postCheckout);
router.post('/confirm', PaymentController.postConfirm);
router.post('/webhook', PaymentController.postWebhook);
router.post('/referral/code', PaymentController.postReferralCode);
router.post('/referral/redeem', PaymentController.postReferralRedeem);

export default router;
