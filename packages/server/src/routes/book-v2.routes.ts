import { Router } from 'express';
import * as ctrl from '../controllers/book-v2.controller.js';

const router = Router();

// Library
router.get('/', ctrl.listBooks);
router.post('/refresh-index', ctrl.refreshIndex);

// Book CRUD
router.post('/', ctrl.createBook);
router.get('/:bid', ctrl.getBook);
router.patch('/:bid', ctrl.updateBookMeta);
router.delete('/:bid', ctrl.deleteBook);

// usedVariants
router.patch('/:bid/variants', ctrl.patchVariants);

// Text slice
router.get('/:bid/texts/:level/:lang', ctrl.getText);
router.put('/:bid/texts/:level/:lang', ctrl.saveText);

// Style slice
router.get('/:bid/styles/:style', ctrl.getStyle);
router.get('/:bid/styles/:style/characters', ctrl.getCharacters);
router.put('/:bid/styles/:style/characters', ctrl.saveCharacters);

// Games
router.get('/:bid/games', ctrl.listGames);

// Runtime payloads
router.get('/:bid/runtime/viewer', ctrl.runtimeViewer);
router.get('/:bid/runtime/game/:gameId', ctrl.runtimeGame);

export default router;
