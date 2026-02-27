import { Router } from 'express';
import { PhonicsController } from '../controllers/phonics.controller.js';

const router = Router();

router.post('/generate', PhonicsController.generate);

export default router;
