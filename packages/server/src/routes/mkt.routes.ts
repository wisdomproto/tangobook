import { Router } from 'express';
import multer from 'multer';
import {
  generate,
  generateImage,
  translate,
  extractText,
  analyzeReferences,
} from '../controllers/mkt/ai.controller.js';
import { presign, deleteKeys, proxy } from '../controllers/mkt/storage.controller.js';
import { naverKeywords, googleKeywords } from '../controllers/mkt/keywords.controller.js';
import { recommendKeywords, generateIdeas, trending } from '../controllers/mkt/ideas.controller.js';

const router = Router();

// ── File upload middleware for extract-text ───────────────────────────────────
const fileUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// ── AI endpoints ──────────────────────────────────────────────────────────────
// SSE endpoints: client must consume text/event-stream
router.post('/ai/generate', generate);
router.post('/ai/generate-image', generateImage);
router.post('/ai/translate', translate);
router.post('/ai/extract-text', fileUpload.single('file'), extractText);
router.post('/ai/analyze-references', analyzeReferences);

// ── Storage endpoints ─────────────────────────────────────────────────────────
router.post('/storage/presign', presign);
router.post('/storage/delete', deleteKeys);
router.get('/storage/proxy', proxy);

// ── Keyword endpoints ─────────────────────────────────────────────────────────
router.post('/naver/keywords', naverKeywords);
router.post('/google/keywords', googleKeywords);
router.post('/keywords/recommend', recommendKeywords);
router.post('/ideas/generate', generateIdeas);
router.post('/ideas/trending', trending);

export default router;
