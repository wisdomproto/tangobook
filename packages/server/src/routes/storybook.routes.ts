import { Router } from 'express';
import { StorybookController } from '../controllers/storybook.controller.js';
import { BookVideoController } from '../controllers/book-video.controller.js';
import { opsAuth } from '../middleware/ops-auth.middleware.js';

const router = Router();
router.get('/:id/videos', opsAuth, BookVideoController.get);
router.post('/:id/videos/presign', opsAuth, BookVideoController.presign);
router.post('/:id/videos', opsAuth, BookVideoController.save);
router.post('/:id/videos/marketing', opsAuth, BookVideoController.register);

router.get('/', StorybookController.list);
router.get('/:id', StorybookController.getById);
router.post('/', StorybookController.save);
router.delete('/:id', StorybookController.delete);
router.post('/:id/copy', StorybookController.copy);
router.post('/:id/copy-async', StorybookController.copyAsync);
router.get('/copy-progress/:taskId', StorybookController.copyProgress);
router.post('/generate-story', StorybookController.generateStory);
router.post('/generate', StorybookController.generate);
router.post('/simplify-key-objects', StorybookController.simplifyKeyObjects);
router.post('/generate-scene-prompts', StorybookController.generateScenePrompts);

export default router;
