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
import paymentRoutes from './routes/payment.routes.js';
import opsRoutes from './routes/ops.routes.js';
import comicFeedbackRoutes from './routes/comic-feedback.routes.js';
import comicAssetsRoutes from './routes/comic-assets.routes.js';

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
  app.use('/api/payments', paymentRoutes);
  app.use('/api/ops', opsRoutes);
  app.use('/api/comic-feedback', comicFeedbackRoutes);
  app.use('/api/comic-assets', comicAssetsRoutes);

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
    // 서비스워커는 no-cache 로 — 브라우저가 매번 최신 sw.js 를 확인해 업데이트가 전파되게.
    app.get('/sw.js', (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(path.join(clientDist, 'sw.js'));
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
