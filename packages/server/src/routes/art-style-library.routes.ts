import { Router } from 'express';
import { ArtStyleLibraryController } from '../controllers/art-style-library.controller.js';

const router = Router();

router.get('/', ArtStyleLibraryController.list);
router.post('/', ArtStyleLibraryController.save);
router.delete('/all', ArtStyleLibraryController.removeAll);
router.delete('/:id', ArtStyleLibraryController.remove);

export default router;
