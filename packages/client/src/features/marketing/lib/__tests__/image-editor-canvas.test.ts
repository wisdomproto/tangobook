import { describe, it, expect } from 'vitest';
import {
  type EditorElement,
  scalePoint,
  arrowheadPoints,
  historyPush,
  historyUndo,
  historyRedo,
  isDataUrl,
  proxyUrl,
} from '../image-editor-canvas';

describe('scalePoint (display → natural pixel space)', () => {
  it('multiplies x by scaleX and y by scaleY', () => {
    expect(scalePoint(10, 20, 2, 3)).toEqual({ x: 20, y: 60 });
  });
  it('is identity at scale 1', () => {
    expect(scalePoint(7, 9, 1, 1)).toEqual({ x: 7, y: 9 });
  });
});

describe('arrowheadPoints (triangle at the arrow tip)', () => {
  // tip at (100,0), tail at (0,0): angle 0 → the two barbs are symmetric about the x-axis,
  // both with x < tip.x (pointing back toward the tail). headLen 15.
  it('returns two barb points behind a horizontal tip', () => {
    const { p1, p2 } = arrowheadPoints({ tipX: 100, tipY: 0, tailX: 0, tailY: 0, headLen: 15 });
    expect(p1.x).toBeLessThan(100);
    expect(p2.x).toBeLessThan(100);
    // symmetric about y=0
    expect(p1.y).toBeCloseTo(-p2.y, 5);
  });
});

describe('history reducer (pushHistory / undo / redo)', () => {
  const a: EditorElement[] = [{ id: '1', type: 'text', x: 0, y: 0, color: '#fff' }];
  const b: EditorElement[] = [...a, { id: '2', type: 'rect', x: 1, y: 1, color: '#f00' }];
  it('push appends and points the index at the new tail', () => {
    const s0 = { history: [[] as EditorElement[]], index: 0 };
    const s1 = historyPush(s0, a);
    expect(s1.history).toHaveLength(2);
    expect(s1.index).toBe(1);
    expect(s1.history[1]).toBe(a);
  });
  it('push after undo truncates the forward history', () => {
    let s = { history: [[] as EditorElement[]], index: 0 };
    s = historyPush(s, a); // index 1
    s = historyPush(s, b); // index 2
    s = historyUndo(s); // index 1
    s = historyPush(s, a); // truncates [.. , b], appends a → length 3, index 2
    expect(s.history).toHaveLength(3);
    expect(s.index).toBe(2);
    expect(s.history[2]).toBe(a);
  });
  it('undo clamps at 0, redo clamps at the tail', () => {
    let s = { history: [[] as EditorElement[]], index: 0 };
    s = historyUndo(s);
    expect(s.index).toBe(0); // clamp
    s = historyPush(s, a); // index 1
    s = historyRedo(s);
    expect(s.index).toBe(1); // already at tail → clamp
  });
});

describe('proxy-safe loader helpers (I-2)', () => {
  it('isDataUrl detects data: URIs', () => {
    expect(isDataUrl('data:image/webp;base64,AAA')).toBe(true);
    expect(isDataUrl('https://r2/x.webp')).toBe(false);
  });
  it('proxyUrl wraps an R2 url through the mkt proxy', () => {
    expect(proxyUrl('https://r2/x.webp')).toBe(
      '/api/mkt/storage/proxy?url=' + encodeURIComponent('https://r2/x.webp')
    );
  });
});
