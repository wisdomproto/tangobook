import { Router } from 'express';
import { LetterStrokeLibraryController } from '../controllers/letter-stroke-library.controller.js';

const router = Router();

router.get('/', LetterStrokeLibraryController.get);
router.put('/', LetterStrokeLibraryController.put);

export default router;
