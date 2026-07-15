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
import {
  metaPublish,
  publishRun,
  publishDeletePost,
} from '../controllers/mkt/publish.controller.js';
import { metaConnection, metaDisconnect } from '../controllers/mkt/meta-connection.controller.js';
import { youtubeStatus } from '../controllers/mkt/youtube.controller.js';
import {
  analyticsOverview,
  analyticsTraffic,
  analyticsTopPages,
  analyticsCountryTraffic,
  analyticsContentPerformance,
  analyticsSource,
  analyticsLanguage,
  analyticsNewReturning,
  analyticsMembership,
  metaInsights,
  youtubeChannel,
} from '../controllers/mkt/analytics.controller.js';
import { seoAudit, seoCrawl, seoSchemaGenerate } from '../controllers/mkt/seo.controller.js';
import {
  competitorsGapAnalysis,
  competitorsKeywordRankings,
  competitorsSuggest,
  competitorsSerp,
} from '../controllers/mkt/competitors.controller.js';
import { strategyTemplates } from '../controllers/mkt/strategy.controller.js';
import { monitoringSearch, monitoringComment } from '../controllers/mkt/monitoring.controller.js';
import { gateLogin } from '../controllers/mkt/gate.controller.js';
import { feedbackList } from '../controllers/mkt/feedback.controller.js';

const router = Router();

// ── 게이트 로그인 (8054 → 소유자 세션 발급) ───────────────────────────────────
router.post('/gate-login', gateLogin);

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
router.post('/publish/run', publishRun);
router.post('/publish/delete-post', publishDeletePost);

// ── Meta connection (글로벌 암호화 연동 — 토큰 서버 전용) ─────────────────────────
router.get('/meta/connection', metaConnection);
router.delete('/meta/connection', metaDisconnect);
router.get('/youtube/status', youtubeStatus);

// ── Analytics endpoints (server-proxy; per-project creds read server-side) ──────
router.post('/analytics/overview', analyticsOverview);
router.post('/analytics/traffic', analyticsTraffic);
router.post('/analytics/top-pages', analyticsTopPages);
router.post('/analytics/country-traffic', analyticsCountryTraffic);
router.post('/analytics/content-performance', analyticsContentPerformance);
router.post('/analytics/source', analyticsSource);
router.post('/analytics/language', analyticsLanguage);
router.post('/analytics/new-returning', analyticsNewReturning);
router.post('/analytics/membership', analyticsMembership);

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

// ── Competitors SERP (3rd tab — DataForSEO) ──
router.post('/competitors/serp', competitorsSerp);

// ── Strategy (template viewer — disk list; import parse is client-side) ──
router.get('/strategy/templates', strategyTemplates);

// ── Monitoring (server-proxy; scrape + youtube + ig-token-server-side + gemini) ──
router.post('/monitoring/search', monitoringSearch);
router.post('/monitoring/comment', monitoringComment);

// ── 건의함 (사용자 피드백 열람 — service-role 전체 조회) ─────────────────────────
router.get('/feedback', feedbackList);

export default router;
