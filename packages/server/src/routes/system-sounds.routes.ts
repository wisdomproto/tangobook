import { Router } from 'express';
import multer from 'multer';
import { SystemSoundsController } from '../controllers/system-sounds.controller.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

router.post('/upload', upload.array('files', 100), SystemSoundsController.upload);
router.get('/', SystemSoundsController.list);
router.delete('/:language/:type', SystemSoundsController.removeAll);
router.delete('/:language/:type/:name', SystemSoundsController.remove);

export default router;
