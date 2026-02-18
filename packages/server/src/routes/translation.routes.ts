import { Router } from 'express';
import { TranslationController } from '../controllers/translation.controller.js';

const router = Router();

router.post('/page', TranslationController.translatePage);
router.post('/batch', TranslationController.translateBatch);

export default router;
