import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller.js';

const router = Router();

router.post('/checkout', PaymentController.postCheckout);
router.post('/confirm', PaymentController.postConfirm);
router.post('/webhook', PaymentController.postWebhook);

export default router;
