import { Router } from 'express';
import multer from 'multer';
import { LongformController } from '../controllers/longform.controller.js';
import { requireFile } from '../middleware/async-handler.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.post('/analyze', LongformController.analyze);
router.get('/analyze-progress/:projectId', LongformController.getAnalyzeProgress);
router.post('/analyze-scene', LongformController.analyzeScene);
router.post('/generate-clip', LongformController.generateClip);
router.post('/generate-all', LongformController.generateAll);
router.get('/progress/:projectId', LongformController.getProgress);
router.post('/render', LongformController.render);
router.get('/render-progress/:projectId', LongformController.getRenderProgress);
router.post(
  '/upload-bgm',
  upload.single('file'),
  requireFile('BGM 파일이 없습니다.'),
  LongformController.uploadBgm
);

// YouTube
router.get('/youtube/auth-url', LongformController.youtubeAuthUrl);
router.get('/youtube/oauth/callback', LongformController.youtubeCallback);
router.get('/youtube/status', LongformController.youtubeStatus);
router.post('/youtube/disconnect', LongformController.youtubeDisconnect);
router.post('/youtube/upload', LongformController.youtubeUpload);
router.get('/youtube/progress/:projectId', LongformController.getYouTubeProgress);

export default router;
