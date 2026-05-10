// Log buffer must be imported FIRST to capture all console output
import './utils/log-buffer.js';
import { createApp } from './app.js';
import { config } from './config/index.js';
import { prewarmStorybookListCache } from './repositories/r2.repository.js';
import { prewarmPhonicsLibraryCache } from './services/phonics-library.service.js';

const app = createApp();

app.listen(config.port, () => {
  console.warn(`[TangoBook Server] Running on http://localhost:${config.port}`);
  console.warn(`[TangoBook Server] Environment: ${config.nodeEnv}`);
  console.warn(`[TangoBook Server] GEMINI_API_KEY: ${config.gemini.apiKey ? 'SET' : 'NOT SET'}`);
  console.warn(`[TangoBook Server] R2_BUCKET_NAME: ${config.r2.bucketName ? 'SET' : 'NOT SET'}`);
  // 첫 사용자 요청 전에 캐시 prewarm (fire-and-forget)
  prewarmStorybookListCache();
  prewarmPhonicsLibraryCache();
});
