import { Router } from 'express';
import { PlaygroundController } from '../controllers/playground.controller.js';

const router = Router();

router.post('/word-pool/enrich', PlaygroundController.enrichWordPool);
router.get('/word-pool/sample', PlaygroundController.sampleWords);
router.get('/word-pool/by-categories', PlaygroundController.samplePoolByCategories);

export default router;
