import type { Response } from 'express';
import { getAI } from '../../providers/gemini.provider.js';
import { config } from '../../config/index.js';

// ── Pure SSE envelope helpers (also exported for testing) ────────────────────

export function writeSSEChunk(res: Response, text: string): void {
  res.write('data: ' + JSON.stringify({ text }) + '\n\n');
}

export function writeSSEDone(res: Response): void {
  res.write('data: [DONE]\n\n');
}

export function writeSSEError(res: Response, message: string): void {
  res.write('data: ' + JSON.stringify({ error: message }) + '\n\n');
}

// ── Overload detection (mirrors generateTextWithGemini) ──────────────────────

const OVERLOAD_RE = /503|UNAVAILABLE|overloaded|high demand|RESOURCE_EXHAUSTED|429/i;
const FALLBACK_MODEL = 'gemini-2.5-flash-lite';

// ── Core streaming function ───────────────────────────────────────────────────

export interface StreamGenerateOptions {
  prompt: string;
  model?: string;
}

/**
 * Streams a Gemini response as Server-Sent Events onto `res`.
 * Sets SSE headers, iterates the async stream, and closes `res` when done.
 * Retries once on overload with the fallback model.
 */
export async function streamGenerate(
  res: Response,
  { prompt, model }: StreamGenerateOptions
): Promise<void> {
  const primaryModel = model ?? config.gemini.textModel;

  // Set SSE headers before the first write
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const attempt = async (modelName: string): Promise<void> => {
    const stream = await getAI().models.generateContentStream({
      model: modelName,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    for await (const chunk of stream) {
      const text = chunk.text ?? '';
      if (text) writeSSEChunk(res, text);
    }
  };

  try {
    await attempt(primaryModel);
    writeSSEDone(res);
    res.end();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const isOverload = OVERLOAD_RE.test(msg);

    if (isOverload && primaryModel !== FALLBACK_MODEL) {
      console.warn(`[gemini-sse] ${primaryModel} 과부하 → ${FALLBACK_MODEL} 폴백`);
      try {
        await attempt(FALLBACK_MODEL);
        writeSSEDone(res);
        res.end();
      } catch (fallbackErr) {
        const fallbackMsg =
          fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
        writeSSEError(res, `Fallback model error: ${fallbackMsg}`);
        res.end();
      }
    } else {
      writeSSEError(res, msg);
      res.end();
    }
  }
}
