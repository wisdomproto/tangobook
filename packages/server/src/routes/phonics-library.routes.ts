import { Router } from 'express';
import multer from 'multer';
import { PhonicsLibraryController } from '../controllers/phonics-library.controller.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

router.post('/upload', upload.array('files', 100), PhonicsLibraryController.upload);
router.post('/concat', PhonicsLibraryController.concat);
router.get('/', PhonicsLibraryController.list);
router.delete('/:category', PhonicsLibraryController.removeAll);
router.delete('/:category/:sound', PhonicsLibraryController.remove);

export default router;
