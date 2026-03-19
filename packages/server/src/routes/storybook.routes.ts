import { Router } from 'express';
import { StorybookController } from '../controllers/storybook.controller.js';

const router = Router();

router.get('/', StorybookController.list);
router.get('/:id', StorybookController.getById);
router.post('/', StorybookController.save);
router.delete('/:id', StorybookController.delete);
router.post('/:id/copy', StorybookController.copy);
router.post('/generate-story', StorybookController.generateStory);
router.post('/generate', StorybookController.generate);
router.post('/simplify-key-objects', StorybookController.simplifyKeyObjects);
router.post('/generate-scene-prompts', StorybookController.generateScenePrompts);

export default router;
