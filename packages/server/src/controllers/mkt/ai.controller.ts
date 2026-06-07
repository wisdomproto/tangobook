import multer from 'multer';
import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { AppError } from '../../middleware/error.middleware.js';
import { streamGenerate } from '../../services/mkt/gemini-sse.service.js';
import {
  generateImageWithGemini,
  generateTextWithGemini,
} from '../../providers/gemini.provider.js';

// ── multer for file upload (extract-text) ────────────────────────────────────
// 10 MB limit covers typical PDFs and docx files
export const extractTextUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function bufferToBase64(buf: Buffer, mime: string) {
  return { base64: buf.toString('base64'), mimeType: mime };
}

// ── Handlers ──────────────────────────────────────────────────────────────────

/**
 * POST /api/mkt/ai/generate
 * Body: { prompt: string, model?: string }
 * Response: Server-Sent Events (text/event-stream)
 */
export const generate = asyncHandler(async (req: Request, res: Response) => {
  const { prompt, model } = req.body as { prompt?: string; model?: string };
  if (!prompt) throw new AppError(400, 'prompt is required');
  // streamGenerate sets SSE headers, streams, and ends res — do NOT call res.json
  await streamGenerate(res, { prompt, model });
});

/**
 * POST /api/mkt/ai/generate-image
 * Body: { prompt: string, model?: string, aspectRatio?: string, referenceImages?: Array<{base64, mimeType}> }
 * Response: { success: true, data: { image: string } }  (base64 PNG)
 */
export const generateImage = asyncHandler(async (req: Request, res: Response) => {
  const { prompt, model, aspectRatio, referenceImages } = req.body as {
    prompt?: string;
    model?: string;
    aspectRatio?: string;
    referenceImages?: Array<{ base64: string; mimeType: string }>;
  };
  if (!prompt) throw new AppError(400, 'prompt is required');

  const image = await generateImageWithGemini({
    prompt,
    model,
    aspectRatio,
    referenceImages,
  });

  res.json({ success: true, data: { image } });
});

/**
 * POST /api/mkt/ai/translate
 * Body: { prompt: string, model?: string }
 * Response: Server-Sent Events — the client builds the full translation prompt
 */
export const translate = asyncHandler(async (req: Request, res: Response) => {
  const { prompt, model } = req.body as { prompt?: string; model?: string };
  if (!prompt) throw new AppError(400, 'prompt is required');
  await streamGenerate(res, { prompt, model });
});

/**
 * POST /api/mkt/ai/extract-text
 * multipart/form-data: file field = 'file'
 * Supports: .pdf (via unpdf), .docx (via mammoth), .txt / .md (raw)
 * Response: { success: true, data: { text: string } }
 */
async function extractTextFromFile(ext: string, mimetype: string, buffer: Buffer): Promise<string> {
  if (ext === 'pdf' || mimetype === 'application/pdf') {
    // unpdf — extractText returns { text: string[] } (one entry per page) by default
    const { extractText: pdfExtract } = await import('unpdf');
    const uint8 = new Uint8Array(buffer);
    const result = await pdfExtract(uint8);
    // Join pages with newlines; result.text is string[] in the default overload
    return Array.isArray(result.text) ? result.text.join('\n') : (result.text ?? '');
  }
  if (
    ext === 'docx' ||
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  if (['txt', 'md', 'markdown', 'text'].includes(ext)) {
    return buffer.toString('utf-8');
  }
  throw new AppError(400, `지원하지 않는 파일 형식입니다: .${ext}`);
}

export const extractText = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new AppError(400, '파일이 없습니다.');

  const { originalname, buffer, mimetype } = req.file;
  const ext = originalname.split('.').pop()?.toLowerCase() ?? '';
  const text = await extractTextFromFile(ext, mimetype, buffer);

  res.json({ success: true, data: { text } });
});

/**
 * POST /api/mkt/ai/analyze-references
 * Body: { fileUrls: string[], model?: string }
 * Fetches each URL server-side, concatenates text, summarises via Gemini.
 * Response: { success: true, data: { summary: string } }
 */
export const analyzeReferences = asyncHandler(async (req: Request, res: Response) => {
  const { fileUrls, model } = req.body as { fileUrls?: string[]; model?: string };
  if (!Array.isArray(fileUrls) || fileUrls.length === 0) {
    throw new AppError(400, 'fileUrls[] is required and must be non-empty');
  }

  // Fetch each URL (plain text / raw content)
  const { default: axios } = await import('axios');
  const fetched = await Promise.allSettled(
    fileUrls.map((url) => axios.get<string>(url, { responseType: 'text', timeout: 15_000 }))
  );

  const contents: string[] = fetched.map((r, i) =>
    r.status === 'fulfilled'
      ? `--- [Reference ${i + 1}: ${fileUrls[i]}] ---\n${r.value.data}`
      : `--- [Reference ${i + 1}: ${fileUrls[i]} — fetch error: ${(r.reason as Error).message}] ---`
  );

  const combined = contents.join('\n\n');
  const prompt = `You are an analyst. Summarize the following reference documents concisely.\n\n${combined}`;

  const summary = await generateTextWithGemini(prompt, 3, model);
  res.json({ success: true, data: { summary } });
});

// Helper for multer reference (re-export for router wiring)
export function bufferRef(b: Buffer, m: string) {
  return bufferToBase64(b, m);
}
