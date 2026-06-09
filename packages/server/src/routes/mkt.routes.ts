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
import { metaPublish } from '../controllers/mkt/publish.controller.js';
import {
  analyticsOverview,
  analyticsTraffic,
  analyticsTopPages,
  analyticsCountryTraffic,
  analyticsContentPerformance,
  metaInsights,
  youtubeChannel,
} from '../controllers/mkt/analytics.controller.js';
import { seoAudit, seoCrawl, seoSchemaGenerate } from '../controllers/mkt/seo.controller.js';
import {
  competitorsGapAnalysis,
  competitorsKeywordRankings,
  competitorsSuggest,
} from '../controllers/mkt/competitors.controller.js';
import { strategyTemplates } from '../controllers/mkt/strategy.controller.js';

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

// ── Publish endpoints ──────────────────────────────────────────────────────────
router.post('/publish/meta', metaPublish);

// ── Analytics endpoints (server-proxy; per-project creds read server-side) ──────
router.post('/analytics/overview', analyticsOverview);
router.post('/analytics/traffic', analyticsTraffic);
router.post('/analytics/top-pages', analyticsTopPages);
router.post('/analytics/country-traffic', analyticsCountryTraffic);
router.post('/analytics/content-performance', analyticsContentPerformance);

// Meta + YouTube analytics endpoints (4b; token read server-side — R-1/R-6)
router.post('/analytics/meta-insights', metaInsights);
router.post('/analytics/youtube-channel', youtubeChannel);

// ── SEO endpoints (site-analysis SEO sub-tab) ──────────────────────────────────
router.post('/seo/audit', seoAudit);
router.post('/seo/crawl', seoCrawl);
router.post('/seo/schema-generate', seoSchemaGenerate);

// ── Competitor endpoints ──────────────────────────────────────────────────────
router.post('/competitors/gap-analysis', competitorsGapAnalysis);
router.post('/competitors/keyword-rankings', competitorsKeywordRankings);
router.post('/competitors/suggest', competitorsSuggest);

// ── Strategy (template viewer — disk list; import parse is client-side) ──
router.get('/strategy/templates', strategyTemplates);

export default router;
