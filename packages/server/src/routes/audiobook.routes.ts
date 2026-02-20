import { Router } from 'express';
import { AudiobookController } from '../controllers/audiobook.controller.js';

const router = Router();

router.post('/generate', AudiobookController.generate);
router.get('/progress/:projectId', AudiobookController.getProgress);

export default router;
