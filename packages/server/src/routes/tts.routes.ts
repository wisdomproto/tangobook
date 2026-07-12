import { Router } from 'express';
import multer from 'multer';
import { TtsController } from '../controllers/tts.controller.js';
import { requireFile } from '../middleware/async-handler.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.post('/generate', TtsController.generate);
router.post('/batch', TtsController.batch);
router.post('/vocab-unit', TtsController.vocabUnit);
router.post(
  '/upload',
  upload.single('audio'),
  requireFile('오디오 파일이 없습니다.'),
  TtsController.upload
);

export default router;
