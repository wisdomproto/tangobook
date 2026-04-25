import { Router } from 'express';
import multer from 'multer';
import * as ctrl from '../controllers/book-v2.controller.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

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

// Style asset 업로드 (multipart, image field)
router.post('/:bid/styles/:style/cover', upload.single('image'), ctrl.uploadCover);
router.post('/:bid/styles/:style/key-objects/:refId', upload.single('image'), ctrl.uploadKeyObject);
router.post('/:bid/styles/:style/vocabulary/:refId', upload.single('image'), ctrl.uploadVocab);
router.post(
  '/:bid/styles/:style/pages/:level/:illustrationKey',
  upload.single('image'),
  ctrl.uploadPageImage
);

// Audiobook
router.get('/:bid/audiobook', ctrl.getAudiobookProject);
router.put('/:bid/audiobook', ctrl.saveAudiobookProject);
router.get('/:bid/audiobook/renders', ctrl.listAudiobookRenders);
router.post('/:bid/audiobook/render', ctrl.startAudiobookRender);
router.get('/:bid/audiobook/render/progress', ctrl.getAudiobookRenderProgress);

// Games
router.get('/:bid/games', ctrl.listGames);

// Runtime payloads
router.get('/:bid/runtime/viewer', ctrl.runtimeViewer);
router.get('/:bid/runtime/game/:gameId', ctrl.runtimeGame);

export default router;
