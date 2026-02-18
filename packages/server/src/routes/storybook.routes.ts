import { Router } from 'express';
import { StorybookController } from '../controllers/storybook.controller.js';

const router = Router();

router.get('/', StorybookController.list);
router.get('/:id', StorybookController.getById);
router.post('/', StorybookController.save);
router.delete('/:id', StorybookController.delete);
router.post('/generate', StorybookController.generate);

export default router;
