import { Router } from 'express';
import multer from 'multer';
import { ImageController } from '../controllers/image.controller.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/character', ImageController.generateCharacter);
router.post('/cover', ImageController.generateCover);
router.post('/illustration', ImageController.generateIllustration);
router.post('/key-object', ImageController.generateKeyObject);
router.post('/vocabulary', ImageController.generateVocabulary);
router.delete('/cleanup', ImageController.cleanup);
router.post('/upload', upload.single('image'), ImageController.upload);
router.post('/analyze-style', upload.single('image'), ImageController.analyzeStyle);

const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});
router.post('/upload-audio', audioUpload.single('audio'), ImageController.uploadAudio);
router.get('/bgm-list', ImageController.bgmList);

export default router;
