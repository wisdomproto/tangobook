import path from 'path';
import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { AppError } from '../../middleware/error.middleware.js';
import {
  createPresignedUploadUrl,
  deleteManyFromR2,
  downloadFromR2,
  r2PublicUrl,
} from '../../providers/r2.provider.js';

// ── Key builder ───────────────────────────────────────────────────────────────

function buildMktKey(projectId: string, category: string, fileName: string): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  const ext = path.extname(fileName) || '';
  return `mkt/${projectId}/${category}/${ts}-${rand}${ext}`;
}

// ── Handlers ──────────────────────────────────────────────────────────────────

/**
 * POST /api/mkt/storage/presign
 * Body: { projectId, category, fileName, contentType }
 * Response: { success: true, data: { uploadUrl, publicUrl, key } }
 */
export const presign = asyncHandler(async (req: Request, res: Response) => {
  const { projectId, category, fileName, contentType } = req.body as {
    projectId?: string;
    category?: string;
    fileName?: string;
    contentType?: string;
  };

  if (!projectId) throw new AppError(400, 'projectId is required');
  if (!category) throw new AppError(400, 'category is required');
  if (!fileName) throw new AppError(400, 'fileName is required');
  if (!contentType) throw new AppError(400, 'contentType is required');

  const key = buildMktKey(projectId, category, fileName);
  const { uploadUrl, publicUrl } = await createPresignedUploadUrl(key, contentType);

  res.json({ success: true, data: { uploadUrl, publicUrl, key } });
});

/**
 * POST /api/mkt/storage/delete
 * Body: { keys: string[] }
 * Response: { success: true }
 */
export const deleteKeys = asyncHandler(async (req: Request, res: Response) => {
  const { keys } = req.body as { keys?: string[] };

  if (!Array.isArray(keys) || keys.length === 0) {
    throw new AppError(400, 'keys[] is required and must be non-empty');
  }

  await deleteManyFromR2(keys);
  res.json({ success: true });
});

/**
 * GET /api/mkt/storage/proxy?url=<R2 public URL>
 * Extracts the R2 key from the URL, downloads, and streams back.
 * Mirrors the existing /api/r2-proxy handler in app.ts.
 */
export const proxy = asyncHandler(async (req: Request, res: Response) => {
  const url = req.query.url as string | undefined;
  if (!url) throw new AppError(400, 'url query param is required');

  // Derive R2 key from the public URL
  const key = url.startsWith(r2PublicUrl + '/') ? url.slice(r2PublicUrl.length + 1) : url; // fallback: treat as a bare key

  if (!key) throw new AppError(400, 'Could not derive R2 key from url');

  const buffer = await downloadFromR2(key);

  const ext = key.split('.').pop()?.toLowerCase() ?? '';
  const contentTypes: Record<string, string> = {
    mp4: 'video/mp4',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    pdf: 'application/pdf',
    html: 'text/html',
  };
  res.setHeader('Content-Type', contentTypes[ext] ?? 'application/octet-stream');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(buffer);
});
