/**
 * SEO controllers (site-analysis SEO sub-tab).
 * All three endpoints are operator-only tools; graceful errors via AppError.
 *
 * Routes registered in mkt.routes.ts:
 *   POST /api/mkt/seo/audit           { url } → scoreSeoAudit
 *   POST /api/mkt/seo/crawl           { url } → crawlUrl (GEO tab page summary)
 *   POST /api/mkt/seo/schema-generate { content, schemaType, language? } → Gemini JSON-LD
 */

import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { AppError } from '../../middleware/error.middleware.js';
import { auditUrl, crawlUrl, schemaGenerate } from '../../services/mkt/seo.service.js';

/** POST /api/mkt/seo/audit  Body: { url } */
export const seoAudit = asyncHandler(async (req: Request, res: Response) => {
  const { url } = req.body as { url?: string };
  if (!url) throw new AppError(400, 'url is required');
  const data = await auditUrl(url);
  res.json({ success: true, data });
});

/** POST /api/mkt/seo/crawl  Body: { url }  (GEO tab page context) */
export const seoCrawl = asyncHandler(async (req: Request, res: Response) => {
  const { url } = req.body as { url?: string };
  if (!url) throw new AppError(400, 'url is required');
  const data = await crawlUrl(url);
  res.json({ success: true, data });
});

/** POST /api/mkt/seo/schema-generate  Body: { content, schemaType, language? } */
export const seoSchemaGenerate = asyncHandler(async (req: Request, res: Response) => {
  const { content, schemaType, language } = req.body as {
    content?: string;
    schemaType?: string;
    language?: string;
  };
  if (!content) throw new AppError(400, 'content is required');
  const data = await schemaGenerate(content, schemaType ?? 'Article', language);
  res.json({ success: true, data });
});
