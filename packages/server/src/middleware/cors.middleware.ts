import cors from 'cors';
import { config } from '../config/index.js';

export const corsMiddleware = cors({
  origin: config.nodeEnv === 'production' ? process.env.CLIENT_URL : 'http://localhost:5173',
  credentials: true,
});
