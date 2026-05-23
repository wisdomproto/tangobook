import axios from 'axios';
import { uploadJsonToR2, r2PublicUrl } from '../providers/r2.provider.js';
import type {
  KoreanJamoEntry,
  KoreanJamoStrokeLibrary,
  KoreanJamoVariantKey,
  LetterTracingData,
} from '@tangobook/shared';

const KEY = '_index/korean-jamo-stroke-library.json';

const EMPTY: KoreanJamoStrokeLibrary = {
  version: 1,
  updatedAt: new Date(0).toISOString(),
  jamo: {},
};

const VALID_VARIANT_KEYS: KoreanJamoVariantKey[] = [
  'cho-horiz-noJong',
  'cho-horiz-hasJong',
  'cho-vert-noJong',
  'cho-vert-hasJong',
  'jong',
  'vowel-noJong',
  'vowel-hasJong',
];

async function load(): Promise<KoreanJamoStrokeLibrary> {
  try {
    const url = `${r2PublicUrl}/${KEY}`;
    const res = await axios.get<KoreanJamoStrokeLibrary>(url, { timeout: 5000 });
    if (!res.data || typeof res.data !== 'object') return EMPTY;
    const data = res.data;
    return {
      version: 1,
      updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : EMPTY.updatedAt,
      jamo: sanitize(data.jamo),
    };
  } catch {
    return EMPTY;
  }
}

/**
 * PUT — merge mode. input.jamo 의 key 만 업데이트, 기존 자모는 보존.
 * 자모 entry 단위 replace — variants 객체 통째로 교체.
 */
async function save(input: Partial<KoreanJamoStrokeLibrary>): Promise<KoreanJamoStrokeLibrary> {
  const existing = await load();
  const incoming = sanitize(input.jamo);
  const merged: Record<string, KoreanJamoEntry> = { ...existing.jamo };
  for (const [key, value] of Object.entries(incoming)) {
    merged[key] = value;
  }
  const out: KoreanJamoStrokeLibrary = {
    version: 1,
    updatedAt: new Date().toISOString(),
    jamo: merged,
  };
  await uploadJsonToR2(out, KEY);
  return out;
}

function sanitizeStrokeData(value: unknown): LetterTracingData | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as { strokes?: unknown; enforceOrder?: unknown };
  if (!Array.isArray(v.strokes)) return null;
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
      (s): s is { type: 'line' | 'bend' | 'loop'; points: { x: number; y: number }[] } => s !== null
    );
  if (strokes.length === 0) return null;
  return {
    strokes,
    enforceOrder: typeof v.enforceOrder === 'boolean' ? v.enforceOrder : true,
  };
}

function sanitize(jamo: unknown): Record<string, KoreanJamoEntry> {
  if (!jamo || typeof jamo !== 'object') return {};
  const out: Record<string, KoreanJamoEntry> = {};
  for (const [key, value] of Object.entries(jamo as Record<string, unknown>)) {
    if (typeof key !== 'string' || key.length === 0) continue;
    if (!value || typeof value !== 'object') continue;
    const v = value as { variants?: unknown };
    // variants 객체 형식 (신규)
    if (v.variants && typeof v.variants === 'object') {
      const variants: Partial<Record<KoreanJamoVariantKey, LetterTracingData>> = {};
      for (const [vk, vData] of Object.entries(v.variants as Record<string, unknown>)) {
        if (!VALID_VARIANT_KEYS.includes(vk as KoreanJamoVariantKey)) continue;
        const data = sanitizeStrokeData(vData);
        if (data) variants[vk as KoreanJamoVariantKey] = data;
      }
      if (Object.keys(variants).length > 0) {
        out[key] = { variants };
      }
      continue;
    }
    // legacy 단일 stroke 데이터 (구 모델) → variants 의 첫 키로 fallback. 호환 위해 유지.
    const legacyData = sanitizeStrokeData(v);
    if (legacyData) {
      // 자음/모음 판별 없이 'cho-horiz-noJong' 로 fallback 저장. 추후 사용자 편집.
      out[key] = { variants: { 'cho-horiz-noJong': legacyData } };
    }
  }
  return out;
}

export const KoreanJamoStrokeLibraryService = {
  get: load,
  put: save,
};
