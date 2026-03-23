import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import { corsMiddleware } from './middleware/cors.middleware.js';
import { errorMiddleware } from './middleware/error.middleware.js';
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

export function createApp() {
  const app = express();

  // 미들웨어
  app.use(corsMiddleware);
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // 헬스 체크
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
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

  // 프로덕션: 클라이언트 정적 파일 서빙 (개발 모드에서는 Vite가 처리)
  if (process.env.NODE_ENV === 'production') {
    const clientDist = path.join(process.cwd(), 'packages/client/dist');
    app.use(express.static(clientDist));
    app.get('/{*path}', (_req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  // 에러 핸들러 (catch-all 뒤에 등록)
  app.use(errorMiddleware);

  return app;
}
