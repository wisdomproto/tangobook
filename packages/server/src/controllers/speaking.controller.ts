import type { Request, Response } from 'express';
import { whisperProvider } from '../providers/whisper.provider.js';
import { AppError } from '../middleware/error.middleware.js';

// degraded-mode 텔레메트리: 1시간 rolling 카운터
const telemetry = { total: 0, falseSpoken: 0, lastLogAt: Date.now() };
const LOG_INTERVAL_MS = 10 * 60 * 1000;
const ROLL_WINDOW_MS = 60 * 60 * 1000;
let rollStartedAt = Date.now();

function maybeLogTelemetry(): void {
  const now = Date.now();
  if (now - rollStartedAt > ROLL_WINDOW_MS) {
    telemetry.total = 0;
    telemetry.falseSpoken = 0;
    rollStartedAt = now;
  }
  if (now - telemetry.lastLogAt > LOG_INTERVAL_MS && telemetry.total > 0) {
    const ratio = telemetry.falseSpoken / telemetry.total;
    if (ratio > 0.9) {
      console.warn(
        `[speaking/telemetry] degraded-mode warning: ${telemetry.falseSpoken}/${telemetry.total} = ${(ratio * 100).toFixed(1)}% false-spoken`
      );
    }
    telemetry.lastLogAt = now;
  }
}

export async function transcribeController(req: Request, res: Response): Promise<void> {
  const file = (req as Request & { file?: Express.Multer.File }).file;
  const lang = req.body.lang as 'ko' | 'en' | undefined;

  if (!file) throw new AppError(400, 'audio file required');
  if (lang !== 'ko' && lang !== 'en') throw new AppError(400, 'lang must be "ko" or "en"');

  if (!whisperProvider.isEnabled()) {
    res.status(503).json({ success: false, error: 'transcription_unavailable' });
    telemetry.total += 1;
    telemetry.falseSpoken += 1;
    maybeLogTelemetry();
    return;
  }

  try {
    const { transcription } = await whisperProvider.transcribe(
      file.buffer,
      file.mimetype || 'audio/webm',
      lang
    );
    telemetry.total += 1;
    if (!transcription) telemetry.falseSpoken += 1;
    maybeLogTelemetry();
    res.json({ success: true, data: { transcription } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[speaking/transcribe] error:', msg);
    res.status(500).json({ success: false, error: 'transcription_failed' });
    telemetry.total += 1;
    telemetry.falseSpoken += 1;
    maybeLogTelemetry();
  }
}
