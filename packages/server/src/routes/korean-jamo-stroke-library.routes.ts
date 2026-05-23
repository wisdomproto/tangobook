import { Router } from 'express';
import { KoreanJamoStrokeLibraryController } from '../controllers/korean-jamo-stroke-library.controller.js';

const router = Router();

router.get('/', KoreanJamoStrokeLibraryController.get);
router.put('/', KoreanJamoStrokeLibraryController.put);

export default router;
