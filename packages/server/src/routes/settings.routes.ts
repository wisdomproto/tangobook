import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller.js';

const router = Router();

router.get('/title-templates', SettingsController.getTitleTemplates);
router.post('/title-templates', SettingsController.addTitleTemplate);
router.delete('/title-templates/:id', SettingsController.removeTitleTemplate);

export default router;
