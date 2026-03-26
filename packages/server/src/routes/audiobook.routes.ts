import { Router } from 'express';
import { AudiobookController } from '../controllers/audiobook.controller.js';

const router = Router();

router.post('/render', AudiobookController.render);
router.get('/render-progress/:projectId', AudiobookController.getRenderProgress);
router.post('/youtube/upload', AudiobookController.youtubeUpload);
router.get('/youtube/progress/:projectId', AudiobookController.getYouTubeProgress);
router.post('/youtube/generate-meta', AudiobookController.youtubeGenerateMeta);
router.post('/youtube/upload-captions', AudiobookController.youtubeUploadCaptions);
router.get('/youtube/caption-progress/:projectId', AudiobookController.getCaptionProgress);

export default router;
