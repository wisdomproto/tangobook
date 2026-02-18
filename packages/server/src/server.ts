import { createApp } from './app.js';
import { config } from './config/index.js';

const app = createApp();

app.listen(config.port, () => {
  console.warn(`[TangoBook Server] Running on http://localhost:${config.port}`);
  console.warn(`[TangoBook Server] Environment: ${config.nodeEnv}`);
});
