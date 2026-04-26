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

// Longform
router.get('/:bid/longform', ctrl.listLongform);
router.post('/:bid/longform', ctrl.createLongform);
router.get('/:bid/longform/:projectId', ctrl.getLongform);
router.put('/:bid/longform/:projectId', ctrl.saveLongform);
router.delete('/:bid/longform/:projectId', ctrl.deleteLongform);
router.post('/:bid/longform/:projectId/analyze', ctrl.startLongformAnalyze);
router.get('/:bid/longform/:projectId/analyze/progress', ctrl.getLongformAnalyzeProgress);
router.post('/:bid/longform/:projectId/scenes/:sceneId/generate', ctrl.startGenerateClip);
router.get(
  '/:bid/longform/:projectId/scenes/:sceneId/generate/progress',
  ctrl.getGenerateClipProgress
);
router.post('/:bid/longform/:projectId/render', ctrl.startLongformRender);
router.get('/:bid/longform/:projectId/render/progress', ctrl.getLongformRenderProgress);
router.post('/:bid/longform/:projectId/youtube/upload', ctrl.startLongformYouTubeUpload);
router.get('/:bid/longform/:projectId/youtube/progress', ctrl.getLongformYouTubeProgress);
router.post('/:bid/longform/:projectId/youtube/link', ctrl.linkLongformYouTubeVideo);
router.post('/:bid/longform/:projectId/youtube/generate-meta', ctrl.generateLongformYouTubeMeta);

// Games
router.get('/:bid/games', ctrl.listGames);
router.post('/:bid/games/generate', ctrl.generateGame);
router.get('/:bid/games/:gameId', ctrl.getGame);
router.delete('/:bid/games/:gameId', ctrl.deleteGame);

// Marketing — Blog
router.get('/:bid/marketing/blog', ctrl.listBlogs);
router.post('/:bid/marketing/blog', ctrl.createBlog);
router.get('/:bid/marketing/blog/:postId', ctrl.getBlog);
router.put('/:bid/marketing/blog/:postId', ctrl.saveBlog);
router.delete('/:bid/marketing/blog/:postId', ctrl.deleteBlog);

// Marketing — Card News
router.get('/:bid/marketing/card-news', ctrl.listCardNews);
router.post('/:bid/marketing/card-news', ctrl.createCardNews);
router.get('/:bid/marketing/card-news/:projectId', ctrl.getCardNews);
router.put('/:bid/marketing/card-news/:projectId', ctrl.saveCardNews);
router.delete('/:bid/marketing/card-news/:projectId', ctrl.deleteCardNews);

// Runtime payloads
router.get('/:bid/runtime/viewer', ctrl.runtimeViewer);
router.get('/:bid/runtime/game/:gameId', ctrl.runtimeGame);

export default router;
