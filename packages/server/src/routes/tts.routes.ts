import { Router } from 'express';
import multer from 'multer';
import { TtsController } from '../controllers/tts.controller.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.post('/generate', TtsController.generate);
router.post('/batch', TtsController.batch);
router.post('/upload', upload.single('audio'), TtsController.upload);

export default router;
