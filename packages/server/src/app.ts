import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import { corsMiddleware } from './middleware/cors.middleware.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { downloadFromR2 } from './providers/r2.provider.js';
import storybookRoutes from './routes/storybook.routes.js';
import imageRoutes from './routes/image.routes.js';
import ttsRoutes from './routes/tts.routes.js';
import translationRoutes from './routes/translation.routes.js';
import quizRoutes from './routes/quiz.routes.js';
import audiobookRoutes from './routes/audiobook.routes.js';
import phonicsRoutes from './routes/phonics.routes.js';
import gameRoutes from './routes/game.routes.js';
import phonicsLibraryRoutes from './routes/phonics-library.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import systemSoundsRoutes from './routes/system-sounds.routes.js';
import characterLibraryRoutes from './routes/character-library.routes.js';
import artStyleLibraryRoutes from './routes/art-style-library.routes.js';
import vocabularyDbRoutes from './routes/vocabulary-db.routes.js';
import marketingRoutes from './routes/marketing.routes.js';
import promptPresetRoutes from './routes/prompt-preset.routes.js';
import longformRoutes from './routes/longform.routes.js';
import youtubePresetRoutes from './routes/youtube-preset.routes.js';
import { speakingRouter } from './routes/speaking.routes.js';
import bookV2MigrationRoutes from './routes/book-v2-migration.routes.js';
import bookV2Routes from './routes/book-v2.routes.js';
import horiRoutes from './routes/hori.routes.js';
import playgroundRoutes from './routes/playground.routes.js';
import vocabularyUnitRoutes from './routes/vocabulary-unit.routes.js';
import libraryConfigRoutes from './routes/library-config.routes.js';
import vocabOverridesRoutes from './routes/vocab-overrides.routes.js';
import styleGenreMapRoutes from './routes/style-genre-map.routes.js';
import letterStrokeLibraryRoutes from './routes/letter-stroke-library.routes.js';
import koreanJamoStrokeLibraryRoutes from './routes/korean-jamo-stroke-library.routes.js';
import mktRoutes from './routes/mkt.routes.js';
import { metaAuthRouter } from './routes/meta-auth.routes.js';
import blogPublicRoutes from './routes/blog-public.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import opsRoutes from './routes/ops.routes.js';
import comicFeedbackRoutes from './routes/comic-feedback.routes.js';
import comicAssetsRoutes from './routes/comic-assets.routes.js';
import saenghwalStatusRoutes from './routes/saenghwal-status.routes.js';
import saenghwalMemoRoutes from './routes/saenghwal-memo.routes.js';

export function createApp() {
  const app = express();

  // 미들웨어
  app.use(corsMiddleware);

  // COOP/COEP headers for FFmpeg.wasm (SharedArrayBuffer)
  app.use((_req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    next();
  });

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // 헬스 체크
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 디버그 로그 조회 (프로덕션에서 원격 디버깅용)
  app.get('/api/debug/logs', (_req, res) => {
    import('./utils/log-buffer.js').then(({ getLogBuffer }) => {
      const lines = parseInt(_req.query.lines as string) || 200;
      res.json({ success: true, data: getLogBuffer(lines) });
    });
  });

  // API 라우터
  app.use('/api/storybooks', storybookRoutes);
  app.use('/api/images', imageRoutes);
  app.use('/api/tts', ttsRoutes);
  app.use('/api/translation', translationRoutes);
  app.use('/api/quiz', quizRoutes);
  app.use('/api/audiobooks', audiobookRoutes);
  app.use('/api/phonics', phonicsRoutes);
  app.use('/api/games', gameRoutes);
  app.use('/api/phonics-library', phonicsLibraryRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/system-sounds', systemSoundsRoutes);
  app.use('/api/character-library', characterLibraryRoutes);
  app.use('/api/art-style-library', artStyleLibraryRoutes);
  app.use('/api/vocabulary-db', vocabularyDbRoutes);
  app.use('/api/marketing', marketingRoutes);
  app.use('/api/prompt-presets', promptPresetRoutes);
  app.use('/api/longform', longformRoutes);
  app.use('/api/youtube-presets', youtubePresetRoutes);
  app.use('/api/speaking', speakingRouter);
  app.use('/api/admin/book-v2', bookV2MigrationRoutes);
  app.use('/api/v2/books', bookV2Routes);
  app.use('/api/hori', horiRoutes);
  app.use('/api/playground', playgroundRoutes);
  app.use('/api/vocabulary-units', vocabularyUnitRoutes);
  app.use('/api/library-config', libraryConfigRoutes);
  app.use('/api/vocab-overrides', vocabOverridesRoutes);
  app.use('/api/style-genre-map', styleGenreMapRoutes);
  app.use('/api/letter-stroke-library', letterStrokeLibraryRoutes);
  app.use('/api/korean-jamo-stroke-library', koreanJamoStrokeLibraryRoutes);
  // Marketing Phase 0+ — NEW namespace (never collides with /api/marketing)
  app.use('/api/mkt', mktRoutes);
  // Meta OAuth (top-level — FB top-level redirect + callback + data-deletion)
  app.use('/api/auth/meta', metaAuthRouter);
  // 공개 블로그 (발행된 self_hosted 내부 블로그 외부 노출)
  app.use('/api/blog', blogPublicRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/ops', opsRoutes);
  app.use('/api/comic-feedback', comicFeedbackRoutes);
  app.use('/api/comic-assets', comicAssetsRoutes);
  app.use('/api/saenghwal-status', saenghwalStatusRoutes);
  app.use('/api/saenghwal-memo', saenghwalMemoRoutes);

  // R2 프록시 — pub-xxx.r2.dev CORS 미지원 우회
  // GET /api/r2-proxy?key=storybooks/xxx/scene.mp4
  app.get('/api/r2-proxy', async (req, res, next) => {
    try {
      const key = req.query.key as string;
      if (!key) {
        res.status(400).json({ error: 'key required' });
        return;
      }
      const buffer = await downloadFromR2(key);
      const ext = key.split('.').pop()?.toLowerCase();
      const contentTypes: Record<string, string> = {
        mp4: 'video/mp4',
        mp3: 'audio/mpeg',
        wav: 'audio/wav',
        png: 'image/png',
        jpg: 'image/jpeg',
      };
      res.setHeader('Content-Type', contentTypes[ext ?? ''] ?? 'application/octet-stream');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(buffer);
    } catch (err) {
      next(err);
    }
  });

  // 프로덕션: 클라이언트 정적 파일 서빙 (개발 모드에서는 Vite가 처리)
  if (process.env.NODE_ENV === 'production') {
    const clientDist = path.join(process.cwd(), 'packages/client/dist');

    // 비-www → www 301 (중복 호스트 SEO 신호 제거 — sitemap/canonical 은 www 기준)
    app.use((req, res, next) => {
      const host = (req.headers['x-forwarded-host'] as string) || req.headers.host || '';
      if (host === 'tangobook.co.kr') {
        res.redirect(301, `https://www.tangobook.co.kr${req.originalUrl}`);
        return;
      }
      next();
    });

    // 서비스워커는 no-cache 로 — 브라우저가 매번 최신 sw.js 를 확인해 업데이트가 전파되게.
    app.get('/sw.js', (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(path.join(clientDist, 'sw.js'));
    });

    // SEO SSR-lite — 책별 about 페이지에 meta/JSON-LD/본문 주입 (네이버 Yeti 등
    // JS 미실행 크롤러 대응). 실패 시 SPA 폴백. 상세 → seo-ssr.service.ts.
    let cachedIndexHtml: string | null = null;
    app.get('/library/:id/about', async (req, res, next) => {
      try {
        const { renderAboutSeo, injectAboutSeo } = await import('./services/seo-ssr.service.js');
        const { StorybookService } = await import('./services/storybook.service.js');
        const storybook = await StorybookService.getById(req.params.id as string);
        if (!storybook) {
          next(); // SPA 가 404 UI 처리
          return;
        }
        if (!cachedIndexHtml) {
          const { readFile } = await import('node:fs/promises');
          cachedIndexHtml = await readFile(path.join(clientDist, 'index.html'), 'utf-8');
        }
        res
          .setHeader('Cache-Control', 'public, max-age=300')
          .type('html')
          .send(injectAboutSeo(cachedIndexHtml, renderAboutSeo(storybook)));
      } catch {
        next(); // 어떤 실패든 SPA 폴백 — SEO 주입이 서비스를 죽이면 안 됨
      }
    });

    app.use(express.static(clientDist));
    app.get('/{*path}', (_req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  // 에러 핸들러 (catch-all 뒤에 등록)
  app.use(errorMiddleware);

  return app;
}
