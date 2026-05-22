import axios from 'axios';
import { uploadJsonToR2, r2PublicUrl } from '../providers/r2.provider.js';
import type { LetterStrokeLibrary, LetterTracingData } from '@tangobook/shared';

const KEY = '_index/letter-stroke-library.json';

const EMPTY: LetterStrokeLibrary = {
  version: 1,
  updatedAt: new Date(0).toISOString(),
  letters: {},
};

async function load(): Promise<LetterStrokeLibrary> {
  try {
    const url = `${r2PublicUrl}/${KEY}`;
    const res = await axios.get<LetterStrokeLibrary>(url, { timeout: 5000 });
    if (!res.data || typeof res.data !== 'object') return EMPTY;
    const data = res.data;
    return {
      version: 1,
      updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : EMPTY.updatedAt,
      letters: sanitizeLetters(data.letters),
    };
  } catch {
    return EMPTY;
  }
}

/**
 * PUT — merge mode (partial PUT 안전).
 * input.letters 의 key 만 update, 기존 letters 의 나머지 key 는 보존.
 * partial body 가 들어와도 다른 글자가 사라지지 않음.
 * 글자 자체 삭제는 일단 지원 X (52 알파벳 항상 유지가 정상).
 */
async function save(input: Partial<LetterStrokeLibrary>): Promise<LetterStrokeLibrary> {
  const existing = await load();
  const incoming = sanitizeLetters(input.letters);
  const merged: Record<string, LetterTracingData> = { ...existing.letters };
  for (const [key, value] of Object.entries(incoming)) {
    merged[key] = value;
  }
  const out: LetterStrokeLibrary = {
    version: 1,
    updatedAt: new Date().toISOString(),
    letters: merged,
  };
  await uploadJsonToR2(out, KEY);
  return out;
}

function sanitizeLetters(letters: unknown): Record<string, LetterTracingData> {
  if (!letters || typeof letters !== 'object') return {};
  const out: Record<string, LetterTracingData> = {};
  for (const [key, value] of Object.entries(letters as Record<string, unknown>)) {
    if (typeof key !== 'string' || key.length === 0) continue;
    if (!value || typeof value !== 'object') continue;
    const v = value as { strokes?: unknown; enforceOrder?: unknown };
    if (!Array.isArray(v.strokes)) continue;
    const strokes = v.strokes
      .filter(
        (s): s is { type: string; points: unknown } =>
          !!s && typeof s === 'object' && 'type' in s && 'points' in (s as object)
      )
      .map((s) => {
        const type = (s as { type: string }).type;
        if (type !== 'line' && type !== 'bend' && type !== 'loop') return null;
        const pts = (s as { points: unknown }).points;
        if (!Array.isArray(pts)) return null;
        const points = pts
          .filter(
            (p): p is { x: number; y: number } =>
              !!p &&
              typeof p === 'object' &&
              typeof (p as { x: unknown }).x === 'number' &&
              typeof (p as { y: unknown }).y === 'number'
          )
          .map((p) => ({ x: p.x, y: p.y }));
        if (points.length < 2) return null;
        return { type, points };
      })
      .filter(
        (s): s is { type: 'line' | 'bend' | 'loop'; points: { x: number; y: number }[] } =>
          s !== null
      );
    if (strokes.length === 0) continue;
    out[key] = {
      strokes,
      enforceOrder: typeof v.enforceOrder === 'boolean' ? v.enforceOrder : true,
    };
  }
  return out;
}

export const LetterStrokeLibraryService = {
  get: load,
  put: save,
};
