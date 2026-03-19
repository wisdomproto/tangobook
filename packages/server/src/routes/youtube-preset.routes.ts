import { Router } from 'express';
import { YouTubePresetController } from '../controllers/youtube-preset.controller.js';

const router = Router();

router.get('/', YouTubePresetController.list);
router.post('/', YouTubePresetController.create);
router.post('/:id', YouTubePresetController.update);
router.delete('/:id', YouTubePresetController.remove);

export default router;
