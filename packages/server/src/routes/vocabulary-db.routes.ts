import { Router } from 'express';
import { VocabularyDbController } from '../controllers/vocabulary-db.controller.js';

const router = Router();

router.get('/', VocabularyDbController.list);
router.get('/word/:word', VocabularyDbController.getByWord);
router.get('/storybook/:storybookId', VocabularyDbController.getByStorybook);
router.post('/sync', VocabularyDbController.syncFromStorybook);
router.post('/bulk-sync', VocabularyDbController.bulkSync);
router.delete('/reset', VocabularyDbController.reset);

export default router;
