/**
 * SEO service — pure `scoreSeoAudit` + thin `auditUrl` / `crawlUrl` / `schemaGenerate` wrappers.
 *
 * `scoreSeoAudit($, url)` is PURE (takes a cheerio-loaded doc, returns scores + issues)
 * so it is fully unit-testable without network calls. The rubric is ported verbatim from
 * CF `src/app/api/seo/audit/route.ts`.
 *
 * Security (R-8): `auditUrl` / `crawlUrl` validate the URL scheme (http/https only),
 * guarding against SSRF. Both use `AbortSignal.timeout(10_000)` for a 10s fetch timeout.
 */

import * as cheerio from 'cheerio';
import type { CheerioAPI } from 'cheerio';
import { generateTextWithGemini } from '../../providers/gemini.provider.js';
import { config } from '../../config/index.js';
import { AppError } from '../../middleware/error.middleware.js';

// ── View-model types (server-side mirror of client `types/analytics.ts`) ─────

export interface SeoIssue {
  severity: string;
  message: string;
  engine: string;
  fix_action?: string;
}

export interface SeoAuditResult {
  url: string;
  title: string;
  metaDescription: string;
  scores: { google: number; naver: number; geo: number; tech: number };
  issues: SeoIssue[];
  meta: Record<string, unknown>;
}

export interface CrawlResult {
  url: string;
  success: boolean;
  title?: string;
  description?: string;
  headings?: string[];
  bodyText?: string;
  error?: string;
}

// ── PURE scoring function (unit-tested) ──────────────────────────────────────

/**
 * Score an already-loaded cheerio document against four SEO dimensions.
 * Port of CF `seo/audit/route.ts:13-69` (verbatim checks + weights).
 *
 * @param $ - cheerio.load(html) result
 * @param url - the URL of the page (used for https check + returned in result)
 */
export function scoreSeoAudit($: CheerioAPI, url: string): SeoAuditResult {
  // ── Extract signals ─────────────────────────────────────────────────────────
  const title = $('title').text();
  const metaDescription = $('meta[name="description"]').attr('content') || '';
  const h1s = $('h1')
    .map((_, el) => $(el).text())
    .get();
  const h2s = $('h2')
    .map((_, el) => $(el).text())
    .get();
  const images = $('img')
    .map((_, el) => ({ src: $(el).attr('src'), alt: $(el).attr('alt') || '' }))
    .get();
  const imagesWithoutAlt = images.filter((i) => !i.alt).length;
  const links = $('a[href]').length;
  const hasSchema = $('script[type="application/ld+json"]').length > 0;
  const isHttps = url.startsWith('https');
  const hasViewport = $('meta[name="viewport"]').length > 0;
  const canonicalUrl = $('link[rel="canonical"]').attr('href');
  const textLength = $('body').text().replace(/\s+/g, ' ').trim().length;

  // CF `html.includes('"FAQPage"')` reads raw HTML — use $.html() for parity.
  const rawHtml = $.html();

  const issues: SeoIssue[] = [];

  // ── Google Score ────────────────────────────────────────────────────────────
  let google = 0;
  if (title && title.length >= 30 && title.length <= 60) {
    google += 15;
  } else {
    issues.push({
      severity: 'warning',
      message: `Title: ${title.length} chars (optimal 30-60)`,
      engine: 'google',
    });
  }
  if (metaDescription && metaDescription.length >= 120) {
    google += 15;
  } else {
    issues.push({
      severity: 'critical',
      message: 'Meta description missing or too short',
      engine: 'google',
      fix_action: 'Add meta description 120-160 chars',
    });
  }
  if (h1s.length === 1) {
    google += 10;
  } else {
    issues.push({
      severity: 'warning',
      message: `${h1s.length} H1 tags`,
      engine: 'google',
    });
  }
  if (h2s.length >= 2) google += 10;
  if (imagesWithoutAlt === 0 && images.length > 0) {
    google += 10;
  } else if (imagesWithoutAlt > 0) {
    issues.push({
      severity: 'warning',
      message: `${imagesWithoutAlt} images without alt`,
      engine: 'google',
      fix_action: 'Add alt text',
    });
  }
  if (isHttps) google += 10;
  if (hasViewport) google += 10;
  if (canonicalUrl) google += 10;
  if (links > 5) google += 10;

  // ── Naver Score ─────────────────────────────────────────────────────────────
  let naver = 0;
  if (title) naver += 15;
  if (images.length >= 3) {
    naver += 15;
  } else {
    issues.push({ severity: 'warning', message: 'Naver prefers 3+ images', engine: 'naver' });
  }
  if (h2s.length >= 2) naver += 10;
  if (textLength >= 2000) naver += 15;
  if (metaDescription) naver += 10;
  naver += Math.min(35, Math.floor(textLength / 200));

  // ── GEO Score ───────────────────────────────────────────────────────────────
  let geo = 0;
  if (hasSchema) {
    geo += 25;
  } else {
    issues.push({
      severity: 'critical',
      message: 'No Schema markup',
      engine: 'geo',
      fix_action: 'Add JSON-LD Schema',
    });
  }
  if (rawHtml.includes('"FAQPage"')) {
    geo += 20;
  } else {
    issues.push({
      severity: 'warning',
      message: 'No FAQ Schema',
      engine: 'geo',
      fix_action: 'Add FAQ structured data',
    });
  }
  if (h2s.some((h) => h.includes('?'))) geo += 15;
  geo += Math.min(40, Math.floor(textLength / 300));

  // ── Tech Score ──────────────────────────────────────────────────────────────
  let tech = 0;
  if (isHttps) tech += 20;
  if (hasViewport) tech += 20;
  if (canonicalUrl) tech += 15;
  if ($('meta[name="robots"]').length > 0) tech += 10;
  tech += 35; // base

  return {
    url,
    title,
    metaDescription,
    scores: { google, naver, geo, tech },
    issues,
    meta: {
      h1Count: h1s.length,
      h2Count: h2s.length,
      imageCount: images.length,
      linkCount: links,
      textLength,
      hasSchema,
      isHttps,
    },
  };
}

// ── SSRF guard ───────────────────────────────────────────────────────────────

function assertSafeUrl(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new AppError(400, '유효하지 않은 URL입니다.');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new AppError(400, 'URL은 http 또는 https만 허용됩니다.');
  }
}

// ── Network wrappers ─────────────────────────────────────────────────────────

/**
 * Fetch `url`, parse with cheerio, and run `scoreSeoAudit`.
 * Network layer separated from pure scoring so the scorer stays testable.
 */
export async function auditUrl(url: string): Promise<SeoAuditResult> {
  assertSafeUrl(url);
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { 'User-Agent': 'Tangobook SEO Bot/1.0' },
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new AppError(502, `URL 접근 실패: ${msg.slice(0, 200)}`);
  }
  if (!res.ok) {
    throw new AppError(502, `URL 응답 오류 (${res.status})`);
  }
  const html = await res.text();
  return scoreSeoAudit(cheerio.load(html), url);
}

/**
 * Fetch `url` and extract a text summary for the GEO tab's page context.
 * Minimal port of CF `ai/strategy/crawl/route.ts`.
 */
export async function crawlUrl(url: string): Promise<{ analysis?: unknown; text: string }> {
  assertSafeUrl(url);
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Tangobook/1.0)' },
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new AppError(502, `URL 크롤 실패: ${msg.slice(0, 200)}`);
  }
  if (!res.ok) {
    throw new AppError(502, `URL 응답 오류 (${res.status})`);
  }
  const html = await res.text();
  const $ = cheerio.load(html);
  $('script, style, nav, footer, header').remove();

  const title = $('title').text().trim() || undefined;
  const description = $('meta[name="description"]').attr('content')?.trim() || undefined;
  const headings = $('h1, h2, h3')
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean)
    .slice(0, 20);
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 5000) || '';

  return {
    analysis: { url, title, description, headings },
    text: bodyText,
  };
}

/**
 * Generate JSON-LD schema markup via Gemini.
 * Port of CF `seo/schema-generate/route.ts`.
 */
export async function schemaGenerate(
  content: string,
  schemaType: string,
  language?: string
): Promise<{ schema: string }> {
  if (!config.gemini.apiKey) {
    throw new AppError(502, 'Gemini API 키가 설정되지 않았습니다.');
  }
  const langNote = language ? `Language: ${language}\n` : '';
  const prompt = `Generate valid JSON-LD Schema.org markup of type "${schemaType || 'Article'}".
${langNote}Output ONLY valid JSON-LD, no explanation. For medical content use MedicalEntity. For Q&A use FAQPage.

Content:
${content.substring(0, 3000)}`;

  const text = await generateTextWithGemini(prompt, 3, config.gemini.textModel);
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return { schema: jsonMatch ? jsonMatch[0] : text };
}
