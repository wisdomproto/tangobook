import { Router } from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { transcribeController } from '../controllers/speaking.controller.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB 상한
});

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30, // IP당 30회/분
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'rate_limited' },
});

export const speakingRouter = Router();
speakingRouter.post('/transcribe', limiter, upload.single('audio'), transcribeController);
