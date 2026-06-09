/**
 * Pure helpers for the image annotation editor (ImageEditorDialog, Chunk 3).
 * Extracted so the scale math, history reducer, arrowhead geometry, and the
 * proxy-draw fallback (I-2) are unit-testable without a real Canvas/DOM.
 *
 * Ported from ContentFlow image-editor-dialog.tsx (:90-117 history, :319-377 composite)
 * + the canvas-export.ts proxy-draw pattern (spec §6.2, the I-2 correctness fix).
 */

export type ToolType = 'select' | 'text' | 'line' | 'arrow' | 'rect';

export interface EditorElement {
  id: string;
  type: 'text' | 'line' | 'arrow' | 'rect';
  x: number;
  y: number;
  color: string;
  // text
  text?: string;
  fontSize?: number;
  fontWeight?: string;
  shadow?: boolean;
  // line/arrow
  x2?: number;
  y2?: number;
  strokeWidth?: number;
  // rect
  rectWidth?: number;
  rectHeight?: number;
  fillColor?: string;
  borderColor?: string;
  borderWidth?: number;
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/** Display-space (x,y) → natural-pixel space, given per-axis scale factors. */
export function scalePoint(
  x: number,
  y: number,
  scaleX: number,
  scaleY: number
): { x: number; y: number } {
  return { x: x * scaleX, y: y * scaleY };
}

/**
 * The two barb points of an arrowhead triangle at the tip, in the SAME
 * (already-scaled) coordinate space as tip/tail. Mirrors CF :349-361
 * (headLen along ±30° from the tail→tip direction).
 */
export function arrowheadPoints(p: {
  tipX: number;
  tipY: number;
  tailX: number;
  tailY: number;
  headLen: number;
}): { p1: { x: number; y: number }; p2: { x: number; y: number } } {
  const angle = Math.atan2(p.tipY - p.tailY, p.tipX - p.tailX);
  return {
    p1: {
      x: p.tipX - p.headLen * Math.cos(angle - Math.PI / 6),
      y: p.tipY - p.headLen * Math.sin(angle - Math.PI / 6),
    },
    p2: {
      x: p.tipX - p.headLen * Math.cos(angle + Math.PI / 6),
      y: p.tipY - p.headLen * Math.sin(angle + Math.PI / 6),
    },
  };
}

// ─── History reducer (CF :90-117) ──────────────────────────────────────────
export interface HistoryState {
  history: EditorElement[][];
  index: number;
}

/** Append `next`, truncating any forward (redo) history. (CF pushHistory) */
export function historyPush(state: HistoryState, next: EditorElement[]): HistoryState {
  const trimmed = state.history.slice(0, state.index + 1);
  const updated = [...trimmed, next];
  return { history: updated, index: updated.length - 1 };
}

/** Move the index back one, clamped at 0. (CF undo) */
export function historyUndo(state: HistoryState): HistoryState {
  if (state.index <= 0) return state;
  return { history: state.history, index: state.index - 1 };
}

/** Move the index forward one, clamped at the tail. (CF redo) */
export function historyRedo(state: HistoryState): HistoryState {
  if (state.index >= state.history.length - 1) return state;
  return { history: state.history, index: state.index + 1 };
}

// ─── Proxy-draw fallback (I-2 — mirrors canvas-export.ts) ───────────────────
export function isDataUrl(url: string): boolean {
  return url.startsWith('data:');
}

/** Route an R2 URL through the same-origin proxy so Canvas draws are untainted. */
export function proxyUrl(url: string): string {
  return `/api/mkt/storage/proxy?url=${encodeURIComponent(url)}`;
}

/**
 * Load an image for Canvas compositing with the proxy-draw fallback (I-2):
 *   1. Try direct `crossOrigin='anonymous'` (works when R2 bucket CORS is live).
 *   2. On `onerror` (CORS rejection) → retry ONCE via the same-origin proxy.
 *   3. data: URLs load directly (same-origin, never proxied).
 * Rejects only if BOTH the direct and proxy loads fail (caller surfaces an error).
 * Browser/jsdom note: this touches `Image`/DOM, so it is exercised in Chunk 3 manual
 * testing, NOT in this pure unit file (only isDataUrl/proxyUrl are unit-tested here).
 */
export function loadImageWithProxy(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    let triedProxy = false;
    const attempt = (url: string, useProxy: boolean) => {
      const img = new Image();
      if (!isDataUrl(url)) img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => {
        if (!useProxy && !triedProxy && !isDataUrl(src)) {
          triedProxy = true;
          attempt(proxyUrl(src), true);
        } else {
          reject(new Error('image load failed (direct + proxy)'));
        }
      };
      img.src = url;
    };
    attempt(src, false);
  });
}
