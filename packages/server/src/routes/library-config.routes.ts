import { Router } from 'express';
import { LibraryConfigController } from '../controllers/library-config.controller.js';

const router = Router();

router.get('/', LibraryConfigController.get);
router.put('/', LibraryConfigController.put);

export default router;
