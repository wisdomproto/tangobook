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

import type { CardCanvasData, TextBlock } from '../types/cards';

const CANVAS_W = 1080;
const CANVAS_H = 1350; // 4:5

// Design space — all block coords/sizes are authored against this; renderers scale up.
const DESIGN_W = 300;
const DESIGN_H = 375; // 4:5

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

// ─── Zone-fit font sizing ─────────────────────────────────────────────────────

let _measureCtx: CanvasRenderingContext2D | null = null;
function getMeasureCtx(): CanvasRenderingContext2D | null {
  if (_measureCtx) return _measureCtx;
  if (typeof document === 'undefined') return null;
  _measureCtx = document.createElement('canvas').getContext('2d');
  return _measureCtx;
}

/**
 * Largest design-space font size (≤ baseSize) at which `text`, wrapped to
 * `widthPct` of the card, fits within `fitHeightPct` of the card height.
 * Measured in DESIGN space (300×375) via an offscreen canvas, so all three
 * renderers (grid / modal / WebP) derive the same size and just apply their
 * own scale factor.
 */
export function fitFontSize(opts: {
  text: string;
  widthPct: number;
  fitHeightPct: number;
  baseSize: number;
  minSize?: number;
  lineHeight?: number;
  fontWeight: string;
  fontFamily?: string;
}): number {
  const ctx = getMeasureCtx();
  const min = opts.minSize ?? 10;
  const lh = opts.lineHeight ?? 1.4;
  const maxW = (opts.widthPct / 100) * DESIGN_W;
  const maxH = (opts.fitHeightPct / 100) * DESIGN_H;
  let fs = opts.baseSize;
  if (!ctx || !opts.text) return fs;
  while (fs > min) {
    ctx.font = `${opts.fontWeight} ${fs}px "${opts.fontFamily ?? 'Noto Sans KR'}", sans-serif`;
    const lines = wrapLines((t) => ctx.measureText(t).width, opts.text, maxW);
    if (lines.length * fs * lh <= maxH) break;
    fs -= 1;
  }
  return fs;
}

/** Effective design-space font size for a block — zone-fitted if `fitHeight` is set. */
export function effectiveFontSize(block: TextBlock): number {
  if (!block.fitHeight) return block.fontSize;
  return fitFontSize({
    text: block.text,
    widthPct: block.width,
    fitHeightPct: block.fitHeight,
    baseSize: block.fontSize,
    lineHeight: block.lineHeight ?? 1.4,
    fontWeight: String(block.fontWeight),
    fontFamily: block.fontFamily,
  });
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

function drawDivider(ctx: CanvasRenderingContext2D, data: CardCanvasData): void {
  if (!data.divider) return;
  const dy = (data.divider.y / 100) * CANVAS_H;
  const dx = ((data.divider.x ?? 8) / 100) * CANVAS_W;
  const dw = ((data.divider.w ?? 18) / 100) * CANVAS_W;
  const h = Math.max(3, CANVAS_W * 0.006);
  ctx.fillStyle = data.divider.color;
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(dx, dy, dw, h, h / 2);
    ctx.fill();
  } else {
    ctx.fillRect(dx, dy, dw, h);
  }
}

function drawTextBlocks(ctx: CanvasRenderingContext2D, data: CardCanvasData): void {
  drawDivider(ctx, data);

  for (const block of data.textBlocks) {
    if (!block.text || block.hidden) continue;

    const x = (block.x / 100) * CANVAS_W;
    const y = (block.y / 100) * CANVAS_H;
    // Zone-fit (if fitHeight set) then scale from the 300-wide design space to the 1080-wide canvas.
    const fs = effectiveFontSize(block) * (CANVAS_W / 300);

    ctx.font = `${block.fontWeight} ${fs}px "${block.fontFamily ?? 'Noto Sans KR'}", sans-serif`;
    ctx.textBaseline = 'top';

    // Pill mode — rounded background sized to a single line of text (category label / page badge).
    if (block.pill) {
      const tw = ctx.measureText(block.text).width;
      const padX = fs * 0.55;
      const padY = fs * 0.32;
      const pw = tw + padX * 2;
      const ph = fs + padY * 2;
      ctx.fillStyle = block.pillColor ?? 'rgba(0,0,0,0.06)';
      if (typeof ctx.roundRect === 'function') {
        ctx.beginPath();
        ctx.roundRect(x, y, pw, ph, ph / 2);
        ctx.fill();
      } else {
        ctx.fillRect(x, y, pw, ph);
      }
      ctx.fillStyle = block.color;
      ctx.textAlign = 'left';
      ctx.fillText(block.text, x + padX, y + padY);
      continue;
    }

    const maxW = (block.width / 100) * CANVAS_W;
    ctx.fillStyle = block.color;
    ctx.textAlign = block.textAlign as 'left' | 'center' | 'right';

    // X anchor depends on text alignment
    const tx =
      block.textAlign === 'center' ? x + maxW / 2 : block.textAlign === 'right' ? x + maxW : x;

    const lh = block.lineHeight ?? 1.4;
    const lines = wrapLines((t) => ctx.measureText(t).width, block.text, maxW);
    lines.forEach((line, li) => ctx.fillText(line, tx, y + li * fs * lh));
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
      if (data.imageRect) {
        // Box mode: cover-fit into a rounded rect (title above / image center / body below).
        const bx = (data.imageRect.x / 100) * CANVAS_W;
        const by = (data.imageRect.y / 100) * CANVAS_H;
        const bw = (data.imageRect.w / 100) * CANVAS_W;
        const bh = (data.imageRect.h / 100) * CANVAS_H;
        // Full-bleed (covers the whole card) → square corners (Instagram standard).
        const isFull = data.imageRect.w >= 99 && data.imageRect.h >= 99;
        const radius = isFull ? 0 : bw * 0.04;
        const sc = Math.max(bw / img.naturalWidth, bh / img.naturalHeight);
        const dw = img.naturalWidth * sc;
        const dh = img.naturalHeight * sc;
        const dx = bx + (bw - dw) / 2;
        const dy = by + (bh - dh) / 2;
        ctx.save();
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') ctx.roundRect(bx, by, bw, bh, radius);
        else ctx.rect(bx, by, bw, bh);
        ctx.clip();
        ctx.drawImage(img, dx, dy, dw, dh);
        ctx.restore();
      } else {
        // Full-width mode: scale to canvas width, center vertically around imageY %.
        const scale = CANVAS_W / img.naturalWidth;
        const imgH = img.naturalHeight * scale;
        const yCenter = (data.imageY / 100) * CANVAS_H;
        const drawY = yCenter - imgH / 2;
        ctx.drawImage(img, 0, drawY, CANVAS_W, imgH);
      }

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
