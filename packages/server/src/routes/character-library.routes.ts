import { Router } from 'express';
import { CharacterLibraryController } from '../controllers/character-library.controller.js';

const router = Router();

router.get('/', CharacterLibraryController.list);
router.post('/', CharacterLibraryController.save);
router.patch('/by-name/:name', CharacterLibraryController.updateByName);
router.delete('/all', CharacterLibraryController.removeAll);
router.delete('/:id', CharacterLibraryController.remove);

export default router;
