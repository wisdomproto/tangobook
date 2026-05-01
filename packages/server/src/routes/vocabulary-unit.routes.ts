import { Router } from 'express';
import { VocabularyUnitController } from '../controllers/vocabulary-unit.controller.js';

const router = Router();

router.get('/', VocabularyUnitController.list);
router.get('/:id', VocabularyUnitController.getById);
router.post('/', VocabularyUnitController.upsert);
router.delete('/:id', VocabularyUnitController.remove);
router.post('/seed/cambridge', VocabularyUnitController.seedCambridge);

export default router;
