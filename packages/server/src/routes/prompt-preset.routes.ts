import { Router } from 'express';
import { PromptPresetController } from '../controllers/prompt-preset.controller.js';

const router = Router();

router.get('/', PromptPresetController.list);
router.post('/', PromptPresetController.create);
router.post('/:id', PromptPresetController.update);
router.delete('/:id', PromptPresetController.remove);

export default router;
