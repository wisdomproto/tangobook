import { Router } from 'express';
import { VocabOverridesController } from '../controllers/vocab-overrides.controller.js';

const router = Router();

router.get('/', VocabOverridesController.get);
router.put('/', VocabOverridesController.put);

export default router;
