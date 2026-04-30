import { Router } from 'express';
import { CollectionController } from '../controllers/collection.controller.js';

const router = Router();

router.get('/catalog', CollectionController.getCatalog);
router.get('/storybook-index', CollectionController.getStorybookIndex);
router.post('/items', CollectionController.upsertItems);
router.post('/sync-from-books', CollectionController.syncFromBooks);

export default router;
