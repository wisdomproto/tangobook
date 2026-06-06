import { Router } from 'express';
import multer from 'multer';
import { ImageController } from '../controllers/image.controller.js';
import { requireFile } from '../middleware/async-handler.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/character', ImageController.generateCharacter);
router.post('/cover', ImageController.generateCover);
router.post('/illustration', ImageController.generateIllustration);
router.post('/key-object', ImageController.generateKeyObject);
router.post('/hidden-object-scene', ImageController.generateHiddenObjectScene);
router.post('/vocabulary-unit-word', ImageController.generateVocabularyUnitWord);
router.post('/vocabulary', ImageController.generateVocabulary);
router.post('/phonics-word', ImageController.generatePhonicsWord);
router.post('/phonics-flashcards', ImageController.generatePhonicsFlashcards);
router.delete('/cleanup', ImageController.cleanup);
router.post(
  '/upload',
  upload.single('image'),
  requireFile('이미지 파일이 없습니다.'),
  ImageController.upload
);
router.post(
  '/analyze-style',
  upload.single('image'),
  requireFile('이미지 파일이 없습니다.'),
  ImageController.analyzeStyle
);

const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});
router.post(
  '/upload-audio',
  audioUpload.single('audio'),
  requireFile('오디오 파일이 없습니다.'),
  ImageController.uploadAudio
);
router.get('/bgm-list', ImageController.bgmList);
router.delete('/bgm/:bgmId', ImageController.deleteBgm);
router.post('/download-zip', ImageController.downloadZip);

export default router;
