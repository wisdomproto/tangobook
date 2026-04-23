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
router.post('/cancel-render', LongformController.cancelRender);
router.post('/delete-render', LongformController.deleteRender);
router.post(
  '/upload-clip',
  upload.single('file'),
  requireFile('영상 파일이 없습니다.'),
  LongformController.uploadClip
);
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
router.get('/youtube/channels', LongformController.youtubeChannels);
router.post('/youtube/remove-channel', LongformController.youtubeRemoveChannel);
router.post('/youtube/disconnect', LongformController.youtubeDisconnect);
router.post('/youtube/upload', LongformController.youtubeUpload);
router.get('/youtube/progress/:projectId', LongformController.getYouTubeProgress);
router.post('/youtube/generate-meta', LongformController.generateYouTubeMeta);
router.post('/youtube/generate-captions', LongformController.generateCaptions);
router.post('/youtube/upload-captions', LongformController.youtubeUploadCaptions);
router.get('/youtube/caption-progress/:projectId', LongformController.getCaptionProgress);
router.post('/youtube/link-video', LongformController.youtubeLinkVideo);

// Shortform
router.post('/render-shortform', LongformController.renderShortform);
router.get('/shortform-progress/:projectId', LongformController.getShortformProgress);

// Client-side rendering
router.post('/prepare-render', LongformController.prepareRender);
router.post('/render-manifest', LongformController.renderManifest);
router.post('/presigned-upload', LongformController.presignedUpload);
router.post('/confirm-render', LongformController.confirmRender);

// Recovery
router.post('/recover-clips', LongformController.recoverClips);

export default router;
