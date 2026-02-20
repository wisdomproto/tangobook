import { createApp } from './app.js';
import { config } from './config/index.js';

const app = createApp();

app.listen(config.port, () => {
  console.warn(`[TangoBook Server] Running on http://localhost:${config.port}`);
  console.warn(`[TangoBook Server] Environment: ${config.nodeEnv}`);
  console.warn(`[TangoBook Server] GEMINI_API_KEY: ${config.gemini.apiKey ? 'SET' : 'NOT SET'}`);
  console.warn(`[TangoBook Server] R2_BUCKET_NAME: ${config.r2.bucketName ? 'SET' : 'NOT SET'}`);
});
