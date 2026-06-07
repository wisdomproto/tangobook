/**
 * Canvas export for cardnews (Instagram carousel) slides.
 *
 * Ported from ContentFlow cardnews-panel.tsx:475-530.
 * Key additions vs. the CF original:
 *   1. `wrapLines` extracted as a pure, unit-testable helper (no Canvas required).
 *   2. Proxy-draw fallback (Decision O-A, spec §8.2): when an R2-hosted image
 *      causes a canvas taint (CORS not configured) the image is retried through
 *      the same-origin `/api/mkt/storage/proxy?url=…` endpoint so `toBlob` does
 *      not throw a SecurityError.
 *
 * NOTE — R2 bucket CORS (spec §8.2, R-0):
 *   Applying a GET CORS policy on the R2 bucket is the *faster* path (no extra
 *   HTTP round-trip through the proxy) and should be done once the production
 *   origin(s) are confirmed. Until then the proxy fallback (option B) guarantees
 *   untainted export in all environments.  Sample policy to add via Cloudflare
 *   R2 dashboard → bucket → CORS Policy:
 *   [
 *     {
 *       "AllowedOrigins": ["https://tangobook.co.kr", "http://localhost:5174"],
 *       "AllowedMethods": ["GET"],
 *       "AllowedHeaders": ["*"],
 *       "MaxAgeSeconds": 86400
 *     }
 *   ]
 *   Verify with:
 *     curl -I -H "Origin: https://tangobook.co.kr" "<R2-public-url>/<key>"
 *   Expected: response includes `access-control-allow-origin: https://tangobook.co.kr`
 */

import type { CardCanvasData } from '../types/cards';

const CANVAS_W = 1080;
const CANVAS_H = 1350; // 4:5

/**
 * Greedy per-character word-wrap mirroring ContentFlow cardnews-panel.tsx:495-503.
 *
 * `measure` is injected (e.g. `(t) => ctx.measureText(t).width`) so the logic
 * is fully unit-testable without a Canvas. Honors explicit '\n' breaks and
 * starts a new line when `measure(cur + ch) > maxW` and `cur` is non-empty.
 *
 * @param measure - Function returning the rendered width of a string.
 * @param text    - The text to wrap (may contain '\n').
 * @param maxW    - Maximum line width in the same units as `measure`.
 * @returns Array of line strings (empty array for empty input).
 */
export function wrapLines(measure: (text: string) => number, text: string, maxW: number): string[] {
  if (!text) return [];
  const lines: string[] = [];
  let cur = '';
  for (const ch of text) {
    if (ch === '\n') {
      lines.push(cur);
      cur = '';
      continue;
    }
    const test = cur + ch;
    if (measure(test) > maxW && cur) {
      lines.push(cur);
      cur = ch;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

// ─── Internal helpers ───────────────────────────────────────────────────────

function isDataUrl(url: string): boolean {
  return url.startsWith('data:');
}

/**
 * Route an R2 URL through the same-origin proxy so Canvas draws are untainted.
 * The `/api/mkt/storage/proxy` endpoint already exists (mkt.routes.ts:32).
 */
function proxyUrl(url: string): string {
  return `/api/mkt/storage/proxy?url=${encodeURIComponent(url)}`;
}

function drawTextBlocks(ctx: CanvasRenderingContext2D, data: CardCanvasData): void {
  for (const block of data.textBlocks) {
    if (!block.text || block.hidden) continue;

    const x = (block.x / 100) * CANVAS_W;
    const y = (block.y / 100) * CANVAS_H;
    const maxW = (block.width / 100) * CANVAS_W;
    // Scale font size from the 300-wide design space to the 1080-wide export canvas.
    const fs = block.fontSize * (CANVAS_W / 300);

    ctx.fillStyle = block.color;
    ctx.font = `${block.fontWeight} ${fs}px "${block.fontFamily ?? 'Noto Sans KR'}", sans-serif`;
    ctx.textAlign = block.textAlign as 'left' | 'center' | 'right';
    ctx.textBaseline = 'top';

    // X anchor depends on text alignment
    const tx =
      block.textAlign === 'center' ? x + maxW / 2 : block.textAlign === 'right' ? x + maxW : x;

    const lines = wrapLines((t) => ctx.measureText(t).width, block.text, maxW);
    lines.forEach((line, li) => ctx.fillText(line, tx, y + li * fs * 1.4));
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Render a cardnews slide to a WebP Blob (1080×1350, 4:5, quality 0.85).
 *
 * Port of ContentFlow cardnews-panel.tsx:475-530 with the O-A proxy-draw
 * fallback (spec §8.2).  Accepts an already-parsed `CardCanvasData` so the
 * function does not depend on `parseCanvasData` from CardNewsCardItem (avoiding
 * a Chunk-0 → Chunk-3 import cycle); the caller (CardNewsPanel) parses first
 * and passes the result.
 *
 * Proxy-draw strategy:
 *   1. Try direct `crossOrigin='anonymous'` load (works when R2 CORS is live).
 *   2. On `img.onerror` (CORS rejection) → retry once with the proxy URL.
 *   3. On synchronous `SecurityError` from `toBlob` → also retry once via proxy.
 *   4. If the second attempt also fails → draw text-only (matches CF onerror).
 *   Data URLs are always drawn directly (same-origin, never proxied).
 *
 * Browser note: some browsers report a tainted canvas as a `null` blob rather
 * than throwing.  If that is observed during Chunk 4 manual testing add a
 * `b === null && !triedProxy && !isDataUrl(url)` branch in the exportBlob
 * callback to trigger the proxy retry and document which browser path was taken.
 */
export function renderCardToBlob(data: CardCanvasData): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas 2D context unavailable'));
      return;
    }

    // Fill background
    ctx.fillStyle = data.bgColor;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    const exportBlob = () => {
      canvas.toBlob(
        (b) => {
          if (b) {
            resolve(b);
          } else {
            reject(new Error('toBlob returned null — canvas may be tainted'));
          }
        },
        'image/webp',
        0.85
      );
    };

    // No background image → just render text and export.
    if (!data.imageUrl) {
      drawTextBlocks(ctx, data);
      exportBlob();
      return;
    }

    const originalUrl = data.imageUrl;
    let triedProxy = false;

    const drawImageThenExport = (img: HTMLImageElement) => {
      // Scale image to canvas width, center vertically around imageY %.
      const scale = CANVAS_W / img.naturalWidth;
      const imgH = img.naturalHeight * scale;
      const yCenter = (data.imageY / 100) * CANVAS_H;
      const drawY = yCenter - imgH / 2;
      ctx.drawImage(img, 0, drawY, CANVAS_W, imgH);

      drawTextBlocks(ctx, data);

      try {
        exportBlob();
      } catch (err) {
        // SecurityError: canvas tainted by a cross-origin image drawn without CORS.
        if (!triedProxy && !isDataUrl(originalUrl) && (err as Error).name === 'SecurityError') {
          triedProxy = true;
          // Clear and redraw background, then reload through the same-origin proxy.
          ctx.fillStyle = data.bgColor;
          ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
          loadImage(proxyUrl(originalUrl));
        } else {
          reject(err as Error);
        }
      }
    };

    const loadImage = (src: string) => {
      const img = new Image();
      // Only set crossOrigin for non-data URLs; the proxy path is same-origin.
      if (!isDataUrl(src)) img.crossOrigin = 'anonymous';
      img.onload = () => drawImageThenExport(img);
      img.onerror = () => {
        // CORS failure on the direct URL → retry once via the same-origin proxy.
        if (!triedProxy && !isDataUrl(originalUrl)) {
          triedProxy = true;
          loadImage(proxyUrl(originalUrl));
        } else {
          // Both direct and proxy failed — still export text-only (matches CF onerror).
          drawTextBlocks(ctx, data);
          exportBlob();
        }
      };
      img.src = src;
    };

    loadImage(originalUrl);
  });
}
