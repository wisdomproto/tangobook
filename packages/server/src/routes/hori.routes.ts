import { Router } from 'express';
import { HoriController } from '../controllers/hori.controller.js';

const router = Router();

router.get('/catalog', HoriController.getCatalog);
router.post('/items', HoriController.upsertItems);

export default router;
